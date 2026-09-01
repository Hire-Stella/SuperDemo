import { initials, isSafeLogoUrl, monogramSvg } from '@superdemo/contracts';
import { cn } from '@/lib/utils';

/**
 * A centre's mark, which always renders something.
 *
 * The fallback is the reason this component exists rather than an `<img>` with a
 * conditional: a tenant should be creatable from a name alone, so every surface
 * that shows a logo has to cope with there not being one. The monogram is drawn
 * from the name in the centre's own `--primary`, which means a demo tenant looks
 * branded the moment it exists.
 *
 * A server component on purpose — it is used in the public landing page's
 * header, where shipping JS to draw two letters would be absurd.
 */
export function TenantLogo({
  name,
  logoUrl,
  size = 32,
  className,
  /** Only for contexts with no cascade to inherit from, e.g. a dark hero. */
  monogramBackground,
  monogramForeground,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
  monogramBackground?: string;
  monogramForeground?: string;
}) {
  // Validated here as well as at the API boundary. This is the last point
  // before the value becomes an attribute, and a component that is safe on its
  // own does not depend on every future caller having validated first.
  if (isSafeLogoUrl(logoUrl)) {
    return (
      // Plain <img>: the URL is arbitrary and off-platform, so next/image would
      // need every client's domain in next.config, which is a deployment edit
      // per tenant — exactly the friction this feature exists to remove.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl!}
        alt={name}
        width={size}
        height={size}
        className={cn('shrink-0 rounded-lg object-contain', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn('inline-block shrink-0', className)}
      style={{ width: size, height: size }}
      // Our own markup from monogramSvg, which escapes the name it embeds.
      dangerouslySetInnerHTML={{
        __html: monogramSvg(name, {
          background: monogramBackground,
          foreground: monogramForeground,
          // Scale the corner with the mark, so a 20px badge and a 64px hero
          // logo read as the same object rather than two shapes.
          radius: Math.max(6, Math.round(size * 0.22)),
        }),
      }}
    />
  );
}

/** The letters alone, for places too small for the mark (a 16px favicon slot). */
export function TenantInitials({ name }: { name: string }) {
  return <span className="font-semibold tracking-wide">{initials(name)}</span>;
}
