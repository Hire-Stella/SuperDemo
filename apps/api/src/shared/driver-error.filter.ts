import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { NotImplementedByDriverError } from '@superdemo/contracts';

/**
 * A driver refusing a capability is a 501, not a 500.
 *
 * These errors are thrown deliberately and carry an actionable sentence — "set
 * the telecaller a phone number in Settings", "needs a TDRA-licensed carrier".
 * Unmapped, Nest turns every one of them into a bare `Internal server error`,
 * which tells the person clicking Call precisely nothing and sends whoever is
 * debugging it looking for a crash that never happened.
 *
 * 501 Not Implemented is the honest code: the request was well formed and the
 * server understood it, but this deployment's configuration cannot carry it out.
 * The message is passed through because it is written for the operator — these
 * strings are configuration guidance, never internals, so quoting them leaks
 * nothing.
 */
@Catch(NotImplementedByDriverError)
export class DriverErrorFilter implements ExceptionFilter {
  private readonly log = new Logger('DriverError');

  catch(err: NotImplementedByDriverError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    // Warn, not error: nothing is broken. Someone asked a driver for something
    // it was never configured to do, and the log should read that way.
    this.log.warn(err.message);
    res.status(HttpStatus.NOT_IMPLEMENTED).json({
      statusCode: HttpStatus.NOT_IMPLEMENTED,
      error: 'Not Implemented',
      message: err.message,
    });
  }
}
