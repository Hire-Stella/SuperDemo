# ---
# pytest: false
# ---

# # Run streaming ASR inference with NVIDIA Nemotron 3.5 ASR on Modal

# This mirrors the structure of `modal_gemma_deploy.py` (image -> cached weights ->
# a `Server`/`Model` class -> local test entrypoint), swapped from an LLM served by
# vLLM to a speech-to-text model served by a small FastAPI app.
#
# `nvidia/nemotron-3.5-asr-streaming-0.6b` is a 600M-parameter cache-aware
# FastConformer-RNNT model that transcribes 40 language-locales
# (https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b). There's no
# off-the-shelf CLI server for it the way `vllm serve` is for LLMs, so instead of
# `@app.server` wrapping a subprocess, this uses a Modal class with `@modal.enter()`
# to load the model once per container and `@modal.asgi_app()` to expose it over HTTP.

# ## Set up the container image

import modal

# NeMo's own `ASRModel.from_pretrained(...).transcribe(...)` path is broken for this
# specific model as of 2026-08: it raises `ValueError: Unknown prompt key: 'None'`
# because the model is prompt-conditioned (needs a target_lang/language token) and
# transcribe() doesn't expose a clean way to supply it
# (https://github.com/NVIDIA-NeMo/Speech/issues/15820, opened 2026-06-22, unresolved).
# The model card's `transformers` pipeline path (AutoModelForRNNT + AutoProcessor,
# with `language=` passed to the processor) avoids that bug and also skips
# installing the much heavier `nemo_toolkit[asr]` dependency tree -- so that's what
# this uses. If a future `transformers` release breaks this model the same way
# 5.15.0 broke vLLM+Gemma4 (see modal_gemma_deploy.py), pin `transformers` to the
# last known-good version here and note the breaking release/commit.
asr_image = (
    modal.Image.from_registry("nvidia/cuda:12.9.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .apt_install("libsndfile1", "ffmpeg")  # audio decode/resample for soundfile & torchaudio
    .uv_pip_install(
        "torch",
        "transformers",
        "accelerate",
        "soundfile",
        "librosa",  # resampling to the 16kHz mono the model expects
        "fastapi[standard]",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1"})
)

# ## Download the model weights

MODEL_NAME = "nvidia/nemotron-3.5-asr-streaming-0.6b"

# Audio requirements per the model card: mono, 16kHz. We resample any input to this
# before handing it to the processor.
SAMPLE_RATE = 16_000

hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)

# ## Configuring the server

app = modal.App("example-nemotron-asr-streaming")

MINUTES = 60  # seconds

# A 600M-parameter model needs a fraction of the VRAM Gemma 4 does -- L4/T4 are
# both large overkill margins here, kept as a fallback list the same way
# modal_gemma_deploy.py falls back across GPU types to make scheduling easier.
GPU_TYPES = ["L4", "T4", "L40S"]


@app.cls(
    image=asr_image,
    gpu=GPU_TYPES,
    scaledown_window=15 * MINUTES,
    # Scale to zero when idle -- no request, no GPU, no billing. First request
    # after idle pays a cold-start (model load) cost instead.
    min_containers=0,
    volumes={"/root/.cache/huggingface": hf_cache_vol},
    secrets=[modal.Secret.from_name("hf-token")],
    # Pinned to the same region as modal_gemma_deploy.py's routing/compute region
    # so both services run close to each other.
    region="ap-south",
)
class Model:
    @modal.enter()
    def load(self):
        import torch
        from transformers import AutoModelForRNNT, AutoProcessor

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = AutoProcessor.from_pretrained(MODEL_NAME)
        self.model = AutoModelForRNNT.from_pretrained(
            MODEL_NAME, device_map=self.device
        ).eval()

    def _transcribe(self, audio, language: str) -> str:
        import torch

        inputs = self.processor(
            audio, sampling_rate=SAMPLE_RATE, language=language, return_tensors="pt"
        ).to(self.device)
        with torch.inference_mode():
            # generate() returns a NemotronAsrStreamingGenerateOutput, not a plain
            # token-id tensor -- the ids are in .sequences. max_new_tokens is set
            # explicitly since the model-agnostic default (max_length=140) would
            # truncate longer utterances.
            output = self.model.generate(**inputs, max_new_tokens=440)
        return self.processor.batch_decode(output.sequences, skip_special_tokens=True)[0]

    @modal.asgi_app()
    def web(self):
        import numpy as np
        import soundfile as sf
        from fastapi import FastAPI, UploadFile

        web_app = FastAPI()

        @web_app.get("/health")
        def health():
            return {"status": "ok"}

        @web_app.post("/transcribe")
        async def transcribe(file: UploadFile, language: str = "auto"):
            raw = await file.read()
            audio, sr = sf.read(io_bytes(raw), dtype="float32", always_2d=False)
            audio = to_mono_16k(audio, sr)
            text = self._transcribe(audio, language)
            return {"text": text, "language": language}

        # Chunked pseudo-streaming: buffers incoming audio and re-transcribes the
        # rolling buffer on each chunk boundary, emitting an updated partial
        # transcript. This is NOT the model's true low-latency cache-aware
        # streaming (that needs NeMo's
        # examples/asr/asr_cache_aware_streaming/speech_to_text_cache_aware_streaming_infer.py,
        # which keeps per-layer encoder cache state across chunks and isn't part of
        # the pip-installable `transformers` path used here) -- it's a simpler
        # approximation adequate for turn-based voice UX like Lampatron's, where a
        # few hundred ms of added latency per partial update is fine.
        @web_app.websocket("/ws/transcribe")
        async def ws_transcribe(websocket):
            from starlette.websockets import WebSocketDisconnect

            await websocket.accept()
            language = websocket.query_params.get("language", "auto")
            buffer = np.zeros((0,), dtype="float32")
            try:
                while True:
                    chunk_bytes = await websocket.receive_bytes()
                    chunk, sr = sf.read(
                        io_bytes(chunk_bytes), dtype="float32", always_2d=False
                    )
                    buffer = np.concatenate([buffer, to_mono_16k(chunk, sr)])
                    text = self._transcribe(buffer, language)
                    await websocket.send_json({"text": text, "final": False})
            except WebSocketDisconnect:
                pass

        return web_app


def io_bytes(raw: bytes):
    import io

    return io.BytesIO(raw)


def to_mono_16k(audio, sr: int):
    import librosa
    import numpy as np

    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    if sr != SAMPLE_RATE:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
    return audio


# ## Testing the server

# `modal run modal_nemotron_asr_deploy.py` spins up a fresh replica and smoke-tests
# the `/health` and `/transcribe` routes with a short synthesized tone -- this
# confirms the deployment and model loading work end-to-end, not transcription
# accuracy (a tone has no speech content to recognize).


@app.local_entrypoint()
def test(audio_path: str = None, language: str = "auto"):
    import time

    import numpy as np
    import requests
    import soundfile as sf

    url = Model().web.get_web_url()

    print(f"Running health check for server at {url}")
    deadline = time.time() + 15 * MINUTES
    while time.time() < deadline:
        try:
            resp = requests.get(f"{url}/health", timeout=30)
        except requests.exceptions.RequestException as exc:
            # Cold container: image pull + model download/load can outlast a single
            # request's timeout, unlike @app.server's flash-service 503 protocol.
            print(f"  not ready yet ({exc.__class__.__name__}), retrying...")
            continue
        if resp.status_code == 200:
            break
        time.sleep(1)
    else:
        raise RuntimeError(f"Failed health check for server at {url}")
    print(f"Successful health check for server at {url}")

    if audio_path:
        with open(audio_path, "rb") as f:
            files = {"file": (audio_path, f, "audio/wav")}
            resp = requests.post(
                f"{url}/transcribe", files=files, params={"language": language}
            )
    else:
        print("No audio_path given -- sending a synthesized tone as a wiring smoke test.")
        tone = 0.1 * np.sin(2 * np.pi * 440 * np.arange(SAMPLE_RATE) / SAMPLE_RATE)
        buf = io_bytes(b"")
        sf.write(buf, tone.astype("float32"), SAMPLE_RATE, format="WAV")
        buf.seek(0)
        files = {"file": ("tone.wav", buf, "audio/wav")}
        resp = requests.post(
            f"{url}/transcribe", files=files, params={"language": language}
        )

    resp.raise_for_status()
    print(resp.json())
