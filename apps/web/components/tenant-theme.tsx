'use client';

import { useEffect } from 'react';
import { resolveThemeTokens, themeToCss, type ThemePreset, type ThemeTokens } from '@fit-ai/contracts';

const STYLE_ID = 'tenant-theme';

/**
 * Applies the signed-in centre's shadcn token overrides.
 *
 * A real <style> element rather than inline styles on <html>: the tokens have to
 * apply to both `:root` and `.dark`, and next-themes owns that class — writing
 * individual properties onto the element would either fight it or need the whole
 * palette duplicated in JS. One stylesheet injected after globals.css wins on
 * document order and is trivially removable when the tenant changes.
 *
 * There is a brief flash of the default palette on hard reload, because the
 * session (and therefore the theme) is only known once the refresh call
 * returns. Fixing that properly means putting the theme in a cookie the server
 * can read at render time — worth doing if it ever grates, not worth the
 * complexity yet.
 */
export function TenantTheme({
  preset,
  tokens,
}: {
  preset: ThemePreset | null | undefined;
  tokens: ThemeTokens | null | undefined;
}) {
  useEffect(() => {
    const css = themeToCss(resolveThemeTokens(preset, tokens));
    const existing = document.getElementById(STYLE_ID);

    // The platform default is the absence of overrides, so clear rather than
    // write an empty rule — otherwise leaving a themed centre would keep its
    // stylesheet around doing nothing.
    if (!css) {
      existing?.remove();
      return;
    }

    const el = existing ?? document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    if (!existing) document.head.append(el);

    return () => {
      // Only tear down on unmount, not on every re-render with the same theme.
      document.getElementById(STYLE_ID)?.remove();
    };
  }, [preset, tokens]);

  return null;
}
