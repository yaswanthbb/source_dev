import type { User } from "@/lib/auth";
import { editorObject } from "@/components/content/editor-data";
import {
  parseGenerationKeys,
  parseGenerationProviders,
  generationUuid,
  type GenerationKey,
  type GenerationProvider,
  type GenerationSettings,
} from "@/components/generation/generation-data";
export type ProviderKey = GenerationKey;
export type Provider = GenerationProvider;
export interface KeyWorkspace {
  user: User;
  keys: ProviderKey[];
  providers: GenerationSettings["providers"];
}
export interface KeyCatalog {
  models: string[];
  live: boolean;
  defaultModel: string;
  binding: string;
}
export type KeyAction =
  | {
      kind: "create";
      provider: Provider;
      apiKey: string;
      label: string;
      defaultModel: string;
      catalog?: KeyCatalog;
    }
  | { kind: "cap"; id: string; value: number }
  | { kind: "label"; id: string; value: string }
  | { kind: "model"; id: string; value: string; catalog?: KeyCatalog }
  | { kind: "default" | "clear-default" | "delete"; id: string };
export function parseKeyWorkspace(
  user: User,
  keys: unknown,
  providers: unknown,
): KeyWorkspace {
  const parsed = parseGenerationKeys(keys),
    choices = parseGenerationProviders(providers);
  if (
    parsed.some((k) => !choices.some((p) => p.provider === k.provider)) ||
    parsed.some((k) => k.label !== null && k.label.length > 120)
  )
    throw new Error("Key metadata is incomplete.");
  return { user, keys: parsed, providers: choices };
}
export function keyFingerprint(data: KeyWorkspace) {
  return JSON.stringify({
    user: [data.user.id, data.user.role],
    keys: data.keys,
    providers: data.providers,
  });
}
export function keyCatalogBinding(data: KeyWorkspace, id: string) {
  return `${keyFingerprint(data)}/${id}`;
}
export function parseKeyCatalog(raw: unknown, binding: string): KeyCatalog {
  const row = editorObject(raw);
  if (
    !Array.isArray(row.models) ||
    !row.models.length ||
    typeof row.live !== "boolean" ||
    typeof row.defaultModel !== "string" ||
    !row.defaultModel.trim()
  )
    throw new Error("Model catalog is incomplete.");
  const models = row.models.map((v: unknown) => {
    if (typeof v !== "string" || !v.trim() || v.trim().length > 120)
      throw new Error("Invalid model.");
    return v.trim();
  });
  if (new Set(models).size !== models.length)
    throw new Error("Duplicate models.");
  return { models, live: row.live, defaultModel: row.defaultModel, binding };
}
export function keyCreateErrors(
  provider: string,
  apiKey: string,
  label: string,
  consent: boolean,
) {
  return {
    provider:
      provider !== "nvidia" && provider !== "gemini"
        ? "Choose a supported provider."
        : undefined,
    secret:
      apiKey.trim().length < 8
        ? "Paste the full provider key (at least 8 characters)."
        : undefined,
    label:
      label.trim().length > 120
        ? "Use a label of 120 characters or fewer."
        : undefined,
    consent: !consent
      ? "Agree to the named provider contact and encrypted storage before saving."
      : undefined,
  };
}
export function keyActionBody(
  data: KeyWorkspace,
  action: KeyAction,
): Record<string, unknown> {
  if (action.kind === "create") {
    if (data.keys.length >= 2)
      throw new Error(
        "Two keys are already stored. Remove one before adding another.",
      );
    const errors = keyCreateErrors(
      action.provider,
      action.apiKey,
      action.label,
      true,
    );
    if (
      Object.values(errors).some(Boolean) ||
      !data.providers.some((p) => p.provider === action.provider)
    )
      throw new Error("Check the provider, full key and label.");
    if (
      action.defaultModel &&
      (!action.catalog?.live ||
        action.catalog.binding !==
          keyCatalogBinding(data, `new:${action.provider}`) ||
        !action.catalog.models.includes(action.defaultModel))
    )
      throw new Error(
        "Verify this key again before choosing its default model.",
      );
    return {
      provider: action.provider,
      apiKey: action.apiKey.trim(),
      ...(action.label.trim() ? { label: action.label.trim() } : {}),
      ...(action.defaultModel ? { defaultModel: action.defaultModel } : {}),
    };
  }
  const id = generationUuid(action.id),
    target = data.keys.find((k) => k.id === id);
  if (!target)
    throw new Error("This key is no longer in your current key list.");
  switch (action.kind) {
    case "cap":
      if (
        !Number.isInteger(action.value) ||
        action.value < 1 ||
        action.value > 50
      )
        throw new Error("Daily cap must be a whole number from 1 to 50.");
      return { dailyLimit: action.value };
    case "label":
      if (action.value.trim().length > 120)
        throw new Error("Use a label of 120 characters or fewer.");
      return { label: action.value.trim() || null };
    case "model":
      if (
        action.value &&
        (!action.catalog ||
          action.catalog.binding !== keyCatalogBinding(data, id) ||
          !action.catalog.models.includes(action.value))
      )
        throw new Error(
          "Load this key’s current models before choosing a default.",
        );
      return { defaultModel: action.value || null };
    case "default":
      return { isDefault: true };
    case "clear-default":
      return { isDefault: false };
    case "delete":
      return {};
  }
}
