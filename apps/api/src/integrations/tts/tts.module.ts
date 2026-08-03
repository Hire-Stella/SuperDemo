import { Global, Injectable, Logger, Module } from '@nestjs/common';
import type { ApiEnv, TtsProvider } from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';
import { ElevenLabsService } from '../elevenlabs/elevenlabs.service';

export const TTS_PROVIDER = Symbol('TTS_PROVIDER');

/**
 * Browser-native speech synthesis. Free, no network hop, Chrome/Edge only. The
 * server never touches audio in this mode — the caller's tab speaks the reply.
 */
@Injectable()
export class WebSpeechTts implements TtsProvider {
  readonly name = 'web-speech';
  readonly runsInBrowser = true;
}

/**
 * Real voices, synthesised server-side.
 *
 * Used by the browser call path so a demo can sound professional without the
 * full Agents telephony stack. When TELEPHONY_DRIVER=elevenlabs, ElevenLabs
 * synthesises inside the call and this driver isn't in the audio path.
 */
@Injectable()
export class ElevenLabsTts implements TtsProvider {
  readonly name = 'elevenlabs';
  readonly runsInBrowser = false;
  private readonly log = new Logger(ElevenLabsTts.name);

  constructor(private readonly service: ElevenLabsService) {}

  async synthesise(text: string, voice: string): Promise<{ audio: Uint8Array; mimeType: string }> {
    const result = await this.service.synthesise(text, voice || undefined);
    this.log.debug(`synthesised ${result.audio.byteLength} bytes for ${text.length} chars`);
    return { audio: new Uint8Array(result.audio), mimeType: result.mimeType };
  }
}

@Global()
@Module({
  providers: [
    WebSpeechTts,
    ElevenLabsTts,
    {
      provide: TTS_PROVIDER,
      useFactory: (env: ApiEnv, web: WebSpeechTts, eleven: ElevenLabsTts): TtsProvider => {
        const log = new Logger('TtsModule');
        if (env.TTS_DRIVER === 'elevenlabs') {
          if (!env.ELEVENLABS_API_KEY) {
            // Fail soft rather than crash a live call: a missing key should
            // degrade the voice, not take the phone line down.
            log.warn('TTS_DRIVER=elevenlabs but no API key — falling back to browser Web Speech');
            return web;
          }
          log.log(`TTS: elevenlabs (${env.ELEVENLABS_VOICE_ID})`);
          return eleven;
        }
        log.log('TTS: web-speech (browser-native, free)');
        return web;
      },
      inject: [ENV, WebSpeechTts, ElevenLabsTts],
    },
  ],
  exports: [TTS_PROVIDER, ElevenLabsTts],
})
export class TtsModule {}
