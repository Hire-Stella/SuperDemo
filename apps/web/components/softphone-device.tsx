'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Call, Device } from '@twilio/voice-sdk';
import { api } from '@/lib/api';

export type SoftphoneState = 'off' | 'connecting' | 'ready' | 'ringing' | 'on-call' | 'error';

/**
 * The agent's browser, registered with Twilio as a phone.
 *
 * Incoming only, and that is a deliberate narrowing rather than a missing half.
 * The server places every call — it owns the contact, the consent check and the
 * conversation record — and rings this device as the agent's end of it. A
 * browser that could dial out on its own would be a second, unlogged way to
 * call a customer, which is exactly the thing a contact centre must not have.
 *
 * So the access token carries an incoming grant and no outgoing application:
 * there is nothing this credential can be used to dial with if it leaks.
 *
 * Auto-accepting is on purpose too. The agent has already clicked Call and is
 * watching the screen; making them then accept an incoming call from their own
 * system is a second confirmation of a decision they just made, and the pause
 * is dead air the customer would hear as a delay.
 */
export function useSoftphone(enabled: boolean) {
  const [state, setState] = useState<SoftphoneState>('off');
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let device: Device | null = null;

    (async () => {
      try {
        setState('connecting');
        /*
         * Ask for the microphone before registering.
         *
         * Chrome resolves getUserMedia silently if permission was granted
         * earlier and prompts if not — either way, doing it here means the
         * prompt appears while the agent is setting up rather than in the two
         * seconds a customer is waiting to be connected.
         */
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const { token } = await api.get<{ token: string; identity: string }>(
          '/twilio/voice-token',
        );
        if (cancelled) return;

        device = new Device(token, { logLevel: 'error' });
        deviceRef.current = device;

        device.on('registered', () => !cancelled && setState('ready'));
        device.on('error', (e: { message?: string }) => {
          if (cancelled) return;
          setError(e?.message ?? 'softphone error');
          setState('error');
        });
        device.on('incoming', (call: Call) => {
          callRef.current = call;
          setState('ringing');
          call.on('accept', () => setState('on-call'));
          call.on('disconnect', () => {
            callRef.current = null;
            setState('ready');
          });
          call.on('cancel', () => {
            callRef.current = null;
            setState('ready');
          });
          call.accept();
        });

        await device.register();
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
      callRef.current?.disconnect();
      device?.destroy();
      deviceRef.current = null;
      setState('off');
    };
  }, [enabled]);

  /** Drop the browser leg. The server still owns the call record. */
  const hangup = useCallback(() => {
    callRef.current?.disconnect();
  }, []);

  return { state, error, hangup, ready: state === 'ready' || state === 'on-call' };
}
