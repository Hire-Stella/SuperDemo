'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * The centre's Dograh agent on its public page: a call bubble and a chat
 * bubble, stacked in the corner, both reaching the same agent.
 *
 * ## Why chat is not simply a second floating widget
 *
 * It cannot be. Dograh's bundle gives every floating widget the *same* element
 * ids — `dograh-widget-root` and `dograh-widget-cta` — and `renderFloating()`
 * re-finds its container with `getElementById('dograh-widget-root')`. Two
 * floating instances therefore do not merely overlap (the bundle also knows
 * only one position, `bottom-right`); they fight over one id.
 *
 * So chat runs in `embedMode: 'inline'`, which renders into a div we supply and
 * never creates that root. We put that div in a fixed launcher of our own, one
 * bubble above the voice one.
 *
 * ## Their CTA is left alone, deliberately
 *
 * An earlier version hid Dograh's inline CTA and clicked its start button for
 * the visitor, so our icon opened straight into a live chat. It raced: the
 * script is `lazyOnload`, so on the first open the button frequently did not
 * exist yet, nothing started, and the panel showed as an empty white rectangle
 * — a blank box being the worst possible failure for the one control a visitor
 * is meant to trust.
 *
 * Now the launcher only shows and hides. Inside it, Dograh's own CTA renders
 * and the visitor presses it, which is the path their code already handles and
 * cannot race against. One extra click, and it works every time.
 */
export function DograhWidget({
  src,
  chatSrc,
  chatContainerId,
}: {
  src: string | null;
  chatSrc: string | null;
  chatContainerId: string;
}) {
  /**
   * Context the agent can read as {{initial_context.page_url}}.
   *
   * From an effect so the value is the URL the visitor actually landed on;
   * during render there is no `window` and the honest answer is an empty
   * string, which is what would otherwise be baked into the markup.
   */
  const [context, setContext] = useState<string | null>(null);
  useEffect(() => {
    if (!src && !chatSrc) return;
    setContext(
      JSON.stringify({
        page_url: window.location.href,
        today: new Date().toISOString().slice(0, 10),
      }),
    );
  }, [src, chatSrc]);

  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      {src && context ? (
        <Script id="dograh-widget" src={src} strategy="lazyOnload" data-dograh-context={context} />
      ) : null}

      {chatSrc ? (
        <>
          {/*
            Scoped to our launcher so nothing here can reach the voice bubble.
            `bottom: 6.25rem` clears Dograh's own floating pill, which sits at
            1.25rem and is about 3.5rem tall.

            The panel is sized by its content with a ceiling, rather than given
            a fixed height: their CTA is short and their chat panel is tall, and
            a fixed height would letterbox one or clip the other.
          */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
#dograh-chat-launcher{position:fixed;right:1.25rem;bottom:6.25rem;z-index:2147483000;
  display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;}
#dograh-chat-launcher[data-open="false"] #${chatContainerId}{display:none;}
#dograh-chat-launcher[data-open="true"] #${chatContainerId}{
  width:min(22rem,calc(100vw - 2.5rem));max-height:min(30rem,calc(100vh - 12rem));
  overflow:auto;border-radius:1rem;
  box-shadow:0 1.5rem 3rem -0.75rem rgba(0,0,0,.35);}
#dograh-chat-toggle{display:inline-flex;align-items:center;justify-content:center;
  width:3.5rem;height:3.5rem;border:0;border-radius:999px;cursor:pointer;
  background:var(--primary,#2563eb);color:var(--primary-foreground,#fff);
  box-shadow:0 .5rem 1.25rem -0.25rem rgba(0,0,0,.35);transition:transform .15s ease;}
#dograh-chat-toggle:hover{transform:scale(1.06);}
@media (prefers-reduced-motion:reduce){#dograh-chat-toggle{transition:none;}}
`,
            }}
          />
          <div id="dograh-chat-launcher" data-open={chatOpen ? 'true' : 'false'}>
            {/*
              Rendered server-side, and before the script: the bundle logs
              "Container element with id … not found" and renders nothing if its
              div is missing when it initialises.
            */}
            <div id={chatContainerId} />
            <button
              id="dograh-chat-toggle"
              type="button"
              onClick={() => setChatOpen((v) => !v)}
              aria-expanded={chatOpen}
              aria-label={chatOpen ? 'Close the chat' : 'Chat with us'}
            >
              {chatOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
          {context ? (
            <Script
              id="dograh-chat-widget"
              src={chatSrc}
              strategy="lazyOnload"
              data-dograh-context={context}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
