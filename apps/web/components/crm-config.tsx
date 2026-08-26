'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Link2, Trash2 } from 'lucide-react';
import {
  CRM_DRIVER_LABELS,
  CRM_DRIVER_NOTES,
  CrmDriver as CrmDriverEnum,
  ZOHO_REGION_LABELS,
  ZohoRegion as ZohoRegionEnum,
  type CrmConfigView,
  type CrmDriver,
  type ZohoRegion,
} from '@fit-ai/contracts';
import { api } from '@/lib/api';
import { Badge, Button, Input, Select } from '@/components/composites';

/**
 * This centre's CRM.
 *
 * One deployment serves several clients and they do not share a CRM, so the
 * choice and the credentials belong to the centre rather than to an env var.
 *
 * Secrets are write-only by design: the API returns whether each one is set,
 * never its value, so the fields below start empty even when a provider is
 * fully configured. That is why saving requires re-entering them — a credential
 * the UI cannot read is a credential a stolen session cannot exfiltrate.
 */
export function CrmConfigPanel({ config }: { config: CrmConfigView | null }) {
  const queryClient = useQueryClient();
  const current = config?.provider ?? 'mock';

  const [provider, setProvider] = useState<CrmDriver>(current);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [region, setRegion] = useState<ZohoRegion>(config?.region ?? 'com');
  const [clientId, setClientId] = useState(config?.clientId ?? '');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [signingSecret, setSigningSecret] = useState('');

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['crm-connection'] });
    void queryClient.invalidateQueries({ queryKey: ['crm-sync-log'] });
  };

  const save = useMutation({
    mutationFn: () => {
      if (provider === 'bitrix') return api.put('/crm/config', { provider, webhookUrl });
      if (provider === 'zoho')
        return api.put('/crm/config', { provider, region, clientId, clientSecret, refreshToken });
      if (provider === 'hubspot') return api.put('/crm/config', { provider, accessToken });
      if (provider === 'webhook')
        return api.put('/crm/config', {
          provider,
          targetUrl,
          ...(signingSecret ? { signingSecret } : {}),
        });
      return api.put('/crm/config', { provider: 'mock' });
    },
    onSuccess: () => {
      toast.success(`Saved — this centre now syncs to ${CRM_DRIVER_LABELS[provider]}`);
      setWebhookUrl('');
      setClientSecret('');
      setRefreshToken('');
      setAccessToken('');
      setSigningSecret('');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: () => api.del('/crm/config'),
    onSuccess: () => {
      toast.success('CRM configuration removed');
      setProvider('mock');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave =
    provider === 'mock' ||
    (provider === 'bitrix' && webhookUrl.trim().length > 0) ||
    (provider === 'zoho' &&
      clientId.trim().length > 0 &&
      // An existing secret may stay in place while other fields change.
      (clientSecret.trim().length > 0 || config?.hasSecret) &&
      (refreshToken.trim().length > 0 || config?.hasRefreshToken)) ||
    (provider === 'hubspot' && accessToken.trim().length > 0) ||
    (provider === 'webhook' && targetUrl.trim().length > 0);

  return (
    <div className="space-y-3 border-t border-border p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">CRM for this centre</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/80">
            {config?.configured
              ? `Configured${config.updatedAt ? ` · updated ${new Date(config.updatedAt).toLocaleDateString()}` : ''}`
              : 'Not configured — using this deployment’s default'}
          </p>
        </div>
        {config?.configured && (
          <Button
            size="sm"
            variant="ghost"
            loading={clear.isPending}
            onClick={() => {
              if (window.confirm('Remove this centre’s CRM credentials?')) clear.mutate();
            }}
          >
            <Trash2 className="size-3.5" aria-hidden /> Disconnect
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Provider</span>
          <Select value={provider} onChange={(e) => setProvider(e.target.value as CrmDriver)}>
            {CrmDriverEnum.options.map((d) => (
              <option key={d} value={d}>
                {CRM_DRIVER_LABELS[d]}
              </option>
            ))}
          </Select>
          <span className="block text-[11px] text-muted-foreground">
            {CRM_DRIVER_NOTES[provider]}
          </span>
        </label>

        {provider === 'bitrix' && (
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Inbound webhook URL
              {config?.hasWebhookUrl && (
                <Badge className="text-[10px]">
                  <Check className="size-3" aria-hidden /> stored
                </Badge>
              )}
            </span>
            <Input
              type="password"
              autoComplete="off"
              placeholder="https://portal.bitrix24.ae/rest/1/xxxxxxxx/"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <span className="block text-[11px] text-muted-foreground">
              Bitrix24 → Developer resources → Other → Inbound webhook, with the{' '}
              <strong>CRM</strong> and <strong>Telephony</strong> scopes ticked. The URL contains
              its own secret, so it is stored encrypted and never shown again.
            </span>
          </label>
        )}

        {provider === 'zoho' && (
          <>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Data centre</span>
              <Select value={region} onChange={(e) => setRegion(e.target.value as ZohoRegion)}>
                {ZohoRegionEnum.options.map((r) => (
                  <option key={r} value={r}>
                    {ZOHO_REGION_LABELS[r]}
                  </option>
                ))}
              </Select>
              <span className="block text-[11px] text-muted-foreground">
                Must match where the account lives — a token from another region is rejected.
              </span>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Client ID</span>
              <Input
                autoComplete="off"
                placeholder="1000.XXXXXXXXXXXXXXXXXXXX"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Client secret
                {config?.hasSecret && (
                  <Badge className="text-[10px]">
                    <Check className="size-3" aria-hidden /> stored
                  </Badge>
                )}
              </span>
              <Input
                type="password"
                autoComplete="off"
                placeholder={config?.hasSecret ? 'unchanged' : ''}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Refresh token
                {config?.hasRefreshToken && (
                  <Badge className="text-[10px]">
                    <Check className="size-3" aria-hidden /> stored
                  </Badge>
                )}
              </span>
              <Input
                type="password"
                autoComplete="off"
                placeholder={config?.hasRefreshToken ? 'unchanged' : ''}
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
              />
            </label>
            <p className="text-[11px] text-muted-foreground md:col-span-2">
              Zoho API console → Self Client → generate a code for scopes{' '}
              <code className="text-[11px]">ZohoCRM.modules.ALL</code>,{' '}
              <code className="text-[11px]">ZohoCRM.users.READ</code>, then exchange it for a
              refresh token. Refresh tokens do not expire, so this is a one-time setup.
            </p>
          </>
        )}

        {provider === 'hubspot' && (
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Private app token
              {config?.hasAccessToken && (
                <Badge className="text-[10px]">
                  <Check className="size-3" aria-hidden /> stored
                </Badge>
              )}
            </span>
            <Input
              type="password"
              autoComplete="off"
              placeholder={config?.hasAccessToken ? 'unchanged' : 'pat-eu1-xxxxxxxx-...'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <span className="block text-[11px] text-muted-foreground">
              HubSpot → Settings → Integrations → Private Apps → Create. Needs the{' '}
              <code className="text-[11px]">crm.objects.contacts.write</code> and{' '}
              <code className="text-[11px]">crm.objects.calls.write</code> scopes. No app review,
              no OAuth round trip.
            </span>
          </label>
        )}

        {provider === 'webhook' && (
          <>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Endpoint URL
                {config?.hasWebhookUrl === false && config?.targetHost && (
                  <Badge className="text-[10px]">{config.targetHost}</Badge>
                )}
              </span>
              <Input
                type="password"
                autoComplete="off"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Signing secret (recommended)
                {config?.hasSigningSecret && (
                  <Badge className="text-[10px]">
                    <Check className="size-3" aria-hidden /> stored
                  </Badge>
                )}
              </span>
              <Input
                type="password"
                autoComplete="off"
                placeholder={config?.hasSigningSecret ? 'unchanged' : 'at least 16 characters'}
                value={signingSecret}
                onChange={(e) => setSigningSecret(e.target.value)}
              />
              <span className="block text-[11px] text-muted-foreground">
                Each request carries{' '}
                <code className="text-[11px]">X-HireStella-Signature</code>: an HMAC-SHA256 of{' '}
                <code className="text-[11px]">timestamp.body</code>. Verify it so your endpoint
                only accepts posts from us. Events:{' '}
                <code className="text-[11px]">contact.upsert</code>,{' '}
                <code className="text-[11px]">call.started</code>,{' '}
                <code className="text-[11px]">call.finished</code>,{' '}
                <code className="text-[11px]">call.recording</code>,{' '}
                <code className="text-[11px]">activity.logged</code>.
              </span>
            </label>
          </>
        )}

        {provider === 'mock' && (
          <p className="text-[11px] text-muted-foreground md:col-span-2">
            No external CRM. Sync still runs end to end against an in-process mock, so calls,
            recordings and transcripts are exercised without touching a real portal.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!canSave} loading={save.isPending} onClick={() => save.mutate()}>
          <Link2 className="size-3.5" aria-hidden /> Save CRM settings
        </Button>
        {provider !== current && (
          <span className="text-[11px] text-muted-foreground">
            Switching from {CRM_DRIVER_LABELS[current]} to {CRM_DRIVER_LABELS[provider]}
          </span>
        )}
      </div>
    </div>
  );
}
