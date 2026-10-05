'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { User } from '@/lib/auth';
import { useSnackbar } from '@/providers/snackbar-provider';
import { useTheme } from '@/providers/theme-provider';
import { DARK, LIGHT } from '@/components/terminal/themes';
import { TerminalHeader } from '@/components/terminal/terminal-chrome';
import { useTerminalLogout } from '@/components/terminal/logout-dialog';
import { ConfirmModal } from '@/components/confirm-modal';

const DEV_ROUTES = {
  dashboard: '/developer/dashboard',
  terminal: '/developer/terminal',
};

interface KeyMeta {
  id: string;
  provider: string;
  label?: string | null;
  keyHint: string;
  isDefault: boolean;
  dailyLimit: number;
  defaultModel?: string | null;
}

interface ProviderMeta {
  provider: string;
  displayName: string;
  byokOnly: boolean;
  defaultModel: string;
}

interface Quota {
  remaining: number;
  limit: number;
  unlimited: boolean;
  tier: string;
  provider: string;
}

export default function DeveloperKeysPage() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const { requestLogout, dialog: logoutDialog } = useTerminalLogout();
  const { showSuccess, showError } = useSnackbar();
  const queryClient = useQueryClient();

  const [provider, setProvider] = useState('nvidia');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [modelsLive, setModelsLive] = useState(false);
  const [defaultModel, setDefaultModel] = useState('');
  const [capEdits, setCapEdits] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; confirmText: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });

  const { data: user } = useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: async () => (await apiClient.get<User>('/users/me')).data,
  });

  const { data: quota } = useQuery<Quota>({
    queryKey: ['ai', 'quota'],
    queryFn: async () => (await apiClient.get<Quota>('/ai-generate/quota')).data,
  });

  const { data: providers = [] } = useQuery<ProviderMeta[]>({
    queryKey: ['ai', 'providers'],
    queryFn: async () => (await apiClient.get<ProviderMeta[]>('/ai-providers')).data,
  });

  const { data: keys = [], isLoading: keysLoading } = useQuery<KeyMeta[]>({
    queryKey: ['ai', 'keys'],
    queryFn: async () => (await apiClient.get<KeyMeta[]>('/ai-keys')).data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ai', 'keys'] });
    queryClient.invalidateQueries({ queryKey: ['ai', 'quota'] });
  };
  const errMsg = (err: unknown, fallback: string) => {
    const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return Array.isArray(m) ? m.join('; ') : m || fallback;
  };

  const lookupMutation = useMutation({
    mutationFn: async () => {
      if (apiKey.trim().length < 8) throw new Error('Paste the full key first.');
      return (
        await apiClient.post<{ models: string[]; live: boolean }>(
          `/ai-providers/${provider}/models/lookup`,
          { apiKey: apiKey.trim() },
        )
      ).data;
    },
    onSuccess: (res) => {
      setModels(res.models);
      setModelsLive(res.live);
      setDefaultModel('');
      if (!res.live) showError('Provider unreachable — showing curated fallback.');
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error && !('response' in (e as object)) ? e.message : errMsg(e, 'Key rejected.');
      showError(msg);
      setModels([]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post('/ai-keys', {
          provider,
          apiKey: apiKey.trim(),
          ...(label.trim() ? { label: label.trim() } : {}),
          ...(defaultModel ? { defaultModel } : {}),
        })
      ).data,
    onSuccess: () => {
      showSuccess('Key stored encrypted. First key becomes the default.');
      setApiKey('');
      setLabel('');
      setModels([]);
      setDefaultModel('');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to store key.')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      (await apiClient.patch(`/ai-keys/${id}`, body)).data,
    onSuccess: () => {
      showSuccess('Key updated.');
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to update key.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/ai-keys/${id}`)).data,
    onSuccess: () => {
      showSuccess('Key deleted — usage falls back to the free tier.');
      setConfirm((p) => ({ ...p, isOpen: false }));
      invalidate();
    },
    onError: (e: unknown) => showError(errMsg(e, 'Failed to delete key.')),
  });

  const panel: React.CSSProperties = {
    backgroundColor: c.panel,
    border: `1px solid ${c.line}`,
    boxShadow: `3px 3px 0px 0px ${c.shadow}`,
  };
  const headStrip: React.CSSProperties = { backgroundColor: c.head, borderBottom: `1px solid ${c.line}` };
  const inputStyle: React.CSSProperties = { backgroundColor: c.base, border: `1px solid ${c.line}`, color: c.text };
  const btn = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50';
  const ghostBtn = `${btn} border hover:text-text-primary`;

  return (
    <div className="sd-dash min-h-screen flex flex-col relative" style={{ backgroundColor: c.base, color: c.text }}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${isDark ? 'sd-dash-scanlines opacity-40' : 'sd-dash-scanlines-light'}`} aria-hidden="true" />
      <TerminalHeader user={user} active="dashboard" uptime="--:--:--" onLogout={requestLogout} routes={DEV_ROUTES} notificationsHref="/developer/terminal?view=notify" />
      {logoutDialog}

      <main className="w-full px-2 sm:px-3 md:px-4 py-3 flex flex-col gap-3 max-w-6xl mx-auto">
        {/* Quota */}
        <div className="sd-panel flex flex-col" style={panel}>
          <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
            ┌─[ quota ]
          </div>
          <div className="px-4 py-3 text-[13px]" style={{ color: c.text }}>
            {quota ? (
              quota.unlimited ? (
                <span><span style={{ color: c.primary }} className="font-bold">UNLIMITED</span> [admin]</span>
              ) : (
                <span>
                  <span style={{ color: c.primary }} className="font-bold">{quota.remaining}/{quota.limit}</span>
                  {' '}left today [{quota.tier} · {quota.provider}]
                </span>
              )
            ) : (
              <span style={{ color: c.dim }}>LOADING…</span>
            )}
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Add key */}
          <div className="sd-panel lg:col-span-5 flex flex-col" style={panel}>
            <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              ┌─[ add_key :: {keys.length}/2 ]
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold" style={{ color: c.faint }}>PROVIDER:</span>
                {providers.map((p) => (
                  <button
                    key={p.provider}
                    type="button"
                    onClick={() => { setProvider(p.provider); setModels([]); setDefaultModel(''); }}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                    style={provider === p.provider
                      ? { backgroundColor: c.primary, color: c.base }
                      : { border: `1px solid ${c.line}`, color: c.dim, backgroundColor: 'transparent' }}
                  >
                    {p.provider.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste provider API key..."
                autoComplete="off"
                spellCheck={false}
                className="px-3 py-2 rounded-lg text-[12px] font-mono focus:outline-none"
                style={inputStyle}
              />
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional)"
                maxLength={120}
                className="px-3 py-2 rounded-lg text-[13px] focus:outline-none"
                style={inputStyle}
              />
              <button
                type="button"
                disabled={lookupMutation.isPending}
                onClick={() => lookupMutation.mutate()}
                className={ghostBtn}
                style={{ borderColor: c.line, color: c.dim, alignSelf: 'flex-start' }}
              >
                {lookupMutation.isPending ? 'VERIFYING…' : 'VERIFY + LOAD MODELS'}
              </button>
              {models.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg p-2" style={{ backgroundColor: c.hover }}>
                  <span className="text-[11px] font-bold" style={{ color: c.faint }}>
                    MODELS [{modelsLive ? 'LIVE' : 'FALLBACK'}] — pick the default:
                  </span>
                  <select
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="px-3 py-2 rounded-lg text-[12px] font-mono focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">— provider default —</option>
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                disabled={apiKey.trim().length < 8 || createMutation.isPending || keys.length >= 2}
                onClick={() => createMutation.mutate()}
                className="py-2 px-4 font-bold text-[13px] tracking-wider cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: c.primary, color: c.base, boxShadow: `2px 2px 0px 0px ${c.shadowStrong}` }}
              >
                {createMutation.isPending ? 'STORING…' : '[ENTER] STORE ENCRYPTED KEY'}
              </button>
              <p className="text-[11px]" style={{ color: c.faint }}>
                {'// encrypted at rest · never shown again · first key becomes default'}
              </p>
            </div>
          </div>

          {/* List */}
          <div className="sd-panel lg:col-span-7 flex flex-col" style={panel}>
            <div className="px-3 py-1.5 text-[12px] font-bold" style={{ ...headStrip, color: c.ink }}>
              ┌─[ my_keys ]
            </div>
            <div className="px-3 sm:px-4 py-3 flex flex-col gap-2">
              {keysLoading ? (
                <div className="text-[12px]" style={{ color: c.dim }}>LOADING<span className="sd-cursor">_</span></div>
              ) : keys.length === 0 ? (
                <div className="text-[12px]" style={{ color: c.dim }}>
                  NO KEYS — generations run on the free tier (5/day).
                </div>
              ) : (
                keys.map((k) => (
                  <div key={k.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: c.line, backgroundColor: c.base }}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-[13px]" style={{ color: c.ink }}>
                        {k.provider.toUpperCase()} ····{k.keyHint}
                        {k.label ? <span style={{ color: c.dim }}> — {k.label}</span> : null}
                      </span>
                      {k.isDefault && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: c.primary, color: c.base }}>DEFAULT</span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: c.faint }}>
                      cap {k.dailyLimit}/day · model: {k.defaultModel || 'provider default'}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!k.isDefault && (
                        <button type="button"
                          onClick={() => updateMutation.mutate({ id: k.id, body: { isDefault: true } })}
                          className={ghostBtn} style={{ borderColor: c.line, color: c.dim }}>
                          Make default
                        </button>
                      )}
                      <input
                        value={capEdits[k.id] ?? String(k.dailyLimit)}
                        onChange={(e) => setCapEdits((p) => ({ ...p, [k.id]: e.target.value }))}
                        inputMode="numeric"
                        aria-label="Daily cap"
                        className="w-16 px-2 py-1 rounded-lg text-[12px] font-mono focus:outline-none"
                        style={inputStyle}
                      />
                      <button type="button"
                        onClick={() => {
                          const n = Number((capEdits[k.id] ?? String(k.dailyLimit)).trim());
                          if (!Number.isInteger(n) || n < 1 || n > 50) {
                            showError('Cap must be an integer from 1 to 50.');
                            return;
                          }
                          updateMutation.mutate({ id: k.id, body: { dailyLimit: n } });
                        }}
                        className={ghostBtn} style={{ borderColor: c.line, color: c.dim }}>
                        Set cap
                      </button>
                      <button type="button"
                        onClick={() => setConfirm({
                          isOpen: true, title: 'Delete key',
                          message: `Delete the ${k.provider} key ····${k.keyHint}? Usage falls back to the free tier. Blocked while a job is using it.`,
                          confirmText: 'Delete',
                          onConfirm: () => deleteMutation.mutate(k.id),
                        })}
                        className={ghostBtn} style={{ borderColor: c.line, color: c.dim }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <ConfirmModal
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        variant="danger"
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
