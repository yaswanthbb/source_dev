import apiClient from "@/lib/api-client";
import type { User } from "@/lib/auth";
import { parseContentUser } from "@/components/content/content-data";
import { ContentFailure } from "@/components/content/content-client";
import {
  parseGenerationKeys,
  parseGenerationSettings,
} from "@/components/generation/generation-data";
import {
  parseKeyWorkspace,
  keyFingerprint,
  keyActionBody,
  parseKeyCatalog,
  keyCatalogBinding,
  type KeyWorkspace,
  type KeyAction,
  type Provider,
} from "./provider-keys-data";
const timeout = 20000;
export class ProviderKeyFailure extends ContentFailure {}
function failure(error: unknown, sent = false): ProviderKeyFailure {
  if (error instanceof ProviderKeyFailure) return error;
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const privateData = status === 401 || status === 403 || status === 404;
  return new ProviderKeyFailure(
    privateData
      ? "Your session or key access changed. Cached private data is hidden; recheck access."
      : sent && (!status || status === 408 || status >= 500)
        ? "The saved outcome is unknown. Recheck your stored keys before trying again; the request may still finish."
        : status === 400 || status === 422
          ? "The service refused this change. Check the key, selected model, two-key limit and active jobs before rechecking."
          : "The current settings could not be checked. Recheck your connection and saved keys.",
    sent && (!status || status === 408 || status >= 500),
    privateData,
  );
}
async function account(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
) {
  try {
    const user = parseContentUser(
      (await apiClient.get("/users/me", { signal, timeout })).data,
    );
    if (expected && (expected.id !== user.id || expected.role !== user.role))
      throw new ProviderKeyFailure(
        "Your account or role changed. Cached keys and unsaved key input are hidden; recheck access.",
        false,
        true,
      );
    return user;
  } catch (error) {
    if (error instanceof ProviderKeyFailure) throw error;
    const mapped = failure(error);
    throw new ProviderKeyFailure(
      mapped.message,
      false,
      mapped.unavailable || !(error as { response?: unknown })?.response,
    );
  }
}
export async function loadKeyWorkspace(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
): Promise<KeyWorkspace> {
  const user = await account(expected, signal);
  try {
    const [keys, providers] = await Promise.all([
      apiClient.get("/ai-keys", { signal, timeout }),
      apiClient.get("/ai-providers", { signal, timeout }),
    ]);
    try {
      return parseKeyWorkspace(user, keys.data, providers.data);
    } catch {
      throw new ProviderKeyFailure(
        "Stored key metadata could not be confirmed. Cached private data is hidden.",
        false,
        true,
      );
    }
  } catch (error) {
    throw failure(error);
  }
}
async function current(before: KeyWorkspace) {
  const data = await loadKeyWorkspace(before.user);
  if (keyFingerprint(data) !== keyFingerprint(before))
    throw new ProviderKeyFailure(
      "Your saved keys or provider settings changed. Recheck and review the current values before continuing.",
    );
  return data;
}
export async function loadKeyQuota(before: KeyWorkspace, signal?: AbortSignal) {
  const fresh = await current(before);
  try {
    const raw = (await apiClient.get("/ai-generate/quota", { signal, timeout }))
      .data;
    return parseGenerationSettings(fresh.user, fresh.keys, fresh.providers, raw)
      .quota;
  } catch (error) {
    throw failure(error);
  }
}
export async function lookupNewKey(
  before: KeyWorkspace,
  provider: Provider,
  secret: string,
) {
  const fresh = await current(before);
  if (
    !fresh.providers.some((p) => p.provider === provider) ||
    secret.trim().length < 8
  )
    throw new ProviderKeyFailure(
      "Choose a supported provider and paste the full key first.",
    );
  try {
    const raw = (
      await apiClient.post(
        `/ai-providers/${provider}/models/lookup`,
        { apiKey: secret.trim() },
        { timeout },
      )
    ).data;
    await account(before.user);
    const catalog = parseKeyCatalog(
      raw,
      keyCatalogBinding(fresh, `new:${provider}`),
    );
    if (!catalog.live)
      throw new ProviderKeyFailure(
        "A live verification could not be confirmed. This key has not been stored.",
      );
    return catalog;
  } catch (error) {
    if (error instanceof ProviderKeyFailure) throw error;
    throw failure(error);
  }
}
export async function loadStoredKeyModels(before: KeyWorkspace, id: string) {
  const fresh = await current(before),
    key = fresh.keys.find((k) => k.id === id);
  if (!key)
    throw new ProviderKeyFailure("Recheck the current stored key first.");
  try {
    const raw = (
      await apiClient.get(
        `/ai-providers/${key.provider}/models?keyId=${encodeURIComponent(key.id)}`,
        { timeout },
      )
    ).data;
    await account(before.user);
    return parseKeyCatalog(raw, keyCatalogBinding(fresh, id));
  } catch (error) {
    throw failure(error);
  }
}
export async function changeProviderKey(
  before: KeyWorkspace,
  action: KeyAction,
) {
  let body: Record<string, unknown>;
  try {
    body = keyActionBody(before, action);
  } catch (error) {
    throw new ProviderKeyFailure(
      error instanceof Error ? error.message : "Check the key fields.",
    );
  }
  const fresh = await current(before);
  let raw: unknown;
  try {
    raw =
      action.kind === "create"
        ? (await apiClient.post("/ai-keys", body, { timeout })).data
        : action.kind === "delete"
          ? (await apiClient.delete(`/ai-keys/${action.id}`, { timeout })).data
          : (await apiClient.patch(`/ai-keys/${action.id}`, body, { timeout }))
              .data;
  } catch (error) {
    throw failure(error, true);
  }
  try {
    const saved = await loadKeyWorkspace(fresh.user);
    if (action.kind === "delete") {
      if (
        (raw as { success?: unknown })?.success !== true ||
        saved.keys.some((k) => k.id === action.id) ||
        saved.keys.length !== fresh.keys.length - 1
      )
        throw new Error();
    } else {
      const ack = parseGenerationKeys([raw])[0],
        persisted = saved.keys.find((k) => k.id === ack.id);
      if (!persisted || JSON.stringify(ack) !== JSON.stringify(persisted))
        throw new Error();
      if (action.kind === "create") {
        if (
          fresh.keys.some((k) => k.id === ack.id) ||
          saved.keys.length !== fresh.keys.length + 1 ||
          ack.provider !== action.provider ||
          ack.keyHint !== action.apiKey.trim().slice(-4) ||
          ack.label !== (action.label.trim() || null) ||
          ack.defaultModel !== (action.defaultModel || null) ||
          ack.dailyLimit !== 20 ||
          ack.isDefault !== (fresh.keys.length === 0)
        )
          throw new Error();
      } else {
        if (ack.id !== action.id || saved.keys.length !== fresh.keys.length)
          throw new Error();
        const previous = fresh.keys.find((k) => k.id === action.id)!;
        const expected = { ...previous, ...body, updatedAt: ack.updatedAt };
        if (JSON.stringify(expected) !== JSON.stringify(ack)) throw new Error();
      }
    }
    for (const previous of fresh.keys.filter(
      (k) => action.kind === "create" || k.id !== action.id,
    )) {
      const found = saved.keys.find((k) => k.id === previous.id);
      const expected = {
        ...previous,
        isDefault: action.kind === "default" ? false : previous.isDefault,
      };
      if (
        !found ||
        JSON.stringify({ ...found, updatedAt: previous.updatedAt }) !==
          JSON.stringify(expected)
      )
        throw new Error();
    }
    return saved;
  } catch (error) {
    throw new ProviderKeyFailure(
      "The response or saved key state could not be confirmed. Recheck before another change; it may already have saved.",
      true,
      error instanceof ProviderKeyFailure && error.unavailable,
    );
  }
}
