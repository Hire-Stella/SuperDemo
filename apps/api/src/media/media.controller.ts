import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStorage } from '../integrations/storage/storage.module';
import { CurrentUser, Public } from '../auth/guards';
import type { SessionUser } from '@superdemo/contracts';
import { ZodQuery } from '../shared/zod.pipe';

const RecordingQuery = z.object({
  key: z.string().min(1),
  expires: z.coerce.number().int(),
  sig: z.string().min(16),
});

/**
 * Recording upload and playback.
 *
 * Playback is public *by signature*, not by session: an `<audio>` element cannot
 * attach an Authorization header, so the URL itself carries a short-lived HMAC.
 * Every access is written to the audit log, because call recordings of
 * prospective students are exactly the data a client will be asked about.
 */
const MIME_BY_EXT: Record<string, string> = {
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

@Controller('media')
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorage,
  ) {}

  /**
   * The caller's browser uploads its MediaRecorder capture when the call ends.
   * Authenticated, because it writes.
   */
  @Post('recording')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 64 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('callId') callId: string,
    @Query('durationMs') durationMs: string,
    @CurrentUser() user: SessionUser,
  ) {
    if (!file) throw new BadRequestException('No audio file uploaded');
    if (!callId) throw new BadRequestException('callId is required');

    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { id: true },
    });
    if (!call) throw new NotFoundException('Call not found');

    const key = `recordings/${callId}.webm`;
    const stored = await this.storage.put(key, file.buffer, file.mimetype || 'audio/webm');

    const retention = await this.prisma.setting.findFirst();
    const days = retention?.recordingRetentionDays ?? 365;

    const recording = await this.prisma.recording.upsert({
      where: { callId },
      create: {
        callId,
        storageKey: stored.key,
        durationMs: Number(durationMs) || 0,
        mimeType: file.mimetype || 'audio/webm',
        sizeBytes: stored.size,
        expiresAt: new Date(Date.now() + days * 864e5),
      },
      update: {
        storageKey: stored.key,
        durationMs: Number(durationMs) || 0,
        sizeBytes: stored.size,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'recording.upload',
        target: recording.id,
        metadata: { callId, sizeBytes: stored.size },
      },
    });

    return { id: recording.id, sizeBytes: stored.size };
  }

  /** Signed-URL playback, with range support so seeking works. */
  @Public()
  @Get('recording')
  async stream(
    @ZodQuery(RecordingQuery) query: z.infer<typeof RecordingQuery>,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.storage.verifySignature(query.key, query.expires, query.sig)) {
      throw new ForbiddenException('This recording link is invalid or has expired');
    }

    let buffer: Buffer;
    try {
      buffer = await this.storage.read(query.key);
    } catch {
      throw new NotFoundException('Recording file not found on disk');
    }

    await this.prisma.auditLog
      .create({
        data: {
          action: 'recording.play',
          target: query.key,
          ip: req.ip,
          metadata: { userAgent: req.headers['user-agent'] ?? null },
        },
      })
      .catch(() => undefined);

    // From the extension rather than a constant: browser recordings are webm,
    // ElevenLabs' are mp3 and Dograh's wav, and a mislabelled file may not play.
    const contentType = MIME_BY_EXT[query.key.split('.').pop() ?? ''] ?? 'audio/webm';

    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : buffer.length - 1;
      const slice = buffer.subarray(start, end + 1);

      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(slice.length),
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      });
      res.end(slice);
      return;
    }

    res.set({
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=300',
    });
    res.end(buffer);
  }
}
