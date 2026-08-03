import { Global, Injectable, Logger, Module } from '@nestjs/common';
import {
  NotImplementedByDriverError,
  type ApiEnv,
  type TelephonyProvider,
} from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';
import { SimulatedTelephony } from './simulated.telephony';
import { BrowserTelephony } from './browser.telephony';

export const TELEPHONY_PROVIDER = Symbol('TELEPHONY_PROVIDER');

/**
 * Real SIP trunking. Not implemented in v1 — and not because it is hard, but
 * because it cannot be lawfully connected for this client until a TDRA-licensed
 * UAE carrier is contracted (see NOT-IMPLEMENTED.md §4 item 1).
 *
 * Kept as an explicit failing stub so the shape of the work is visible and
 * selecting it fails loudly at boot rather than silently dropping calls.
 */
@Injectable()
export class LiveKitTelephony implements TelephonyProvider {
  readonly name = 'livekit';
  readonly supportsMedia = true;
  readonly supportsOutbound = true;

  private fail(capability: string): never {
    throw new NotImplementedByDriverError('livekit', capability);
  }

  answer(): never {
    this.fail('answer() — needs a LiveKit SIP trunk + a TDRA-licensed UAE carrier');
  }
  play(): never {
    this.fail('play() — needs a server-side TTS driver');
  }
  bridgeAgent(): never {
    this.fail('bridgeAgent() — needs LiveKit room tokens');
  }
  releaseAi(): never {
    this.fail('releaseAi()');
  }
  hold(): never {
    this.fail('hold()');
  }
  hangup(): never {
    this.fail('hangup()');
  }
  dial(): never {
    this.fail('dial() — outbound needs carrier termination');
  }
}

@Global()
@Module({
  providers: [
    SimulatedTelephony,
    BrowserTelephony,
    LiveKitTelephony,
    {
      provide: TELEPHONY_PROVIDER,
      useFactory: (
        env: ApiEnv,
        simulated: SimulatedTelephony,
        browser: BrowserTelephony,
        livekit: LiveKitTelephony,
      ): TelephonyProvider => {
        const log = new Logger('TelephonyModule');
        switch (env.TELEPHONY_DRIVER) {
          case 'browser':
            log.log('telephony: browser (real mic/speaker via Web Speech + WebRTC)');
            return browser;
          case 'livekit':
            log.warn(
              'telephony: livekit selected but NOT IMPLEMENTED — calls will fail. See NOT-IMPLEMENTED.md',
            );
            return livekit;
          case 'simulated':
          default:
            log.log('telephony: simulated (scripted FIT calls, no audio)');
            return simulated;
        }
      },
      inject: [ENV, SimulatedTelephony, BrowserTelephony, LiveKitTelephony],
    },
  ],
  // Both concrete mock drivers are exported so the simulator and browser-call
  // controllers can reach their driver-specific entrypoints regardless of which
  // one is currently the active TELEPHONY_PROVIDER. That means a demo can drive
  // scripted traffic while a live browser call is in progress.
  exports: [TELEPHONY_PROVIDER, SimulatedTelephony, BrowserTelephony],
})
export class TelephonyModule {}
