"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import type { GenerationSettings } from "@/components/generation/generation-data";
import {
  keyCreateErrors,
  keyFingerprint,
  keyCatalogBinding,
  type KeyWorkspace,
  type KeyAction,
  type KeyCatalog,
  type Provider,
  type ProviderKey,
} from "./provider-keys-data";
import base from "@/components/content/new-lesson.module.css";
import styles from "./provider-keys.module.css";
export interface ProviderKeysViewProps {
  data: KeyWorkspace;
  quota?: GenerationSettings["quota"];
  quotaLoading?: boolean;
  quotaError?: string;
  pending?: string;
  blocked?: boolean;
  readError?: string;
  error?: string;
  uncertain?: boolean;
  notice?: { text: string; version: number };
  checkVersion?: number;
  onCheck: () => void;
  onAction: (action: KeyAction) => Promise<boolean>;
  onLookup: (
    provider: Provider,
    secret: string,
  ) => Promise<KeyCatalog | undefined>;
  onModels: (id: string) => Promise<KeyCatalog | undefined>;
  onClassic: () => void;
}
export function ProviderKeysView(props: ProviderKeysViewProps) {
  const { data, pending, blocked, onAction, onCheck } = props;
  const [provider, setProvider] = useState<Provider>("nvidia"),
    [secret, setSecret] = useState(""),
    [label, setLabel] = useState(""),
    [selectedModel, setSelectedModel] = useState(""),
    [consent, setConsent] = useState(false),
    [consentSnapshot, setConsentSnapshot] = useState(""),
    [catalog, setCatalog] = useState<KeyCatalog>(),
    [errors, setErrors] = useState<Record<string, string | undefined>>({}),
    [confirmation, setConfirmation] = useState<{
      key: ProviderKey;
      snapshot: string;
    }>();
  const errorRef = useRef<HTMLDivElement>(null),
    statusRef = useRef<HTMLDivElement>(null),
    validationRef = useRef<HTMLDivElement>(null),
    dialogRef = useRef<HTMLDialogElement>(null),
    cancelRef = useRef<HTMLButtonElement>(null),
    sequence = useRef(0),
    formBusy = useRef(false);
  const fingerprint = keyFingerprint(data),
    currentConsent = confirmation?.snapshot === fingerprint;
  useEffect(() => {
    setConsent(false);
    setCatalog(undefined);
    setSelectedModel("");
    setConfirmation(undefined);
  }, [fingerprint, props.checkVersion]);
  // Close the dialog before focusing a newly reported result.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!confirmation || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, [confirmation]);
  useEffect(() => {
    if (props.error) errorRef.current?.focus();
  }, [props.error]);
  useEffect(() => {
    if (props.notice) statusRef.current?.focus();
  }, [props.notice]);
  useEffect(() => {
    if (Object.values(errors).some(Boolean)) validationRef.current?.focus();
  }, [errors]);
  const providerName =
    data.providers.find((p) => p.provider === provider)?.displayName ??
    provider.toUpperCase();
  const consentCurrent = consent && consentSnapshot === fingerprint;
  const catalogCurrent =
    catalog?.binding === keyCatalogBinding(data, `new:${provider}`);
  function resetVerification() {
    sequence.current++;
    setConsent(false);
    setCatalog(undefined);
    setSelectedModel("");
    setErrors({});
  }
  async function lookup() {
    if (formBusy.current || blocked) return;
    const next = keyCreateErrors(provider, secret, label, consentCurrent);
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }
    formBusy.current = true;
    const request = sequence.current;
    try {
      const result = await props.onLookup(provider, secret);
      if (request === sequence.current) {
        setCatalog(result);
        setSelectedModel("");
      }
    } finally {
      formBusy.current = false;
    }
  }
  async function save() {
    if (formBusy.current || blocked) return;
    const next = keyCreateErrors(provider, secret, label, consentCurrent);
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }
    formBusy.current = true;
    try {
      const ok = await onAction({
        kind: "create",
        provider,
        apiKey: secret,
        label,
        defaultModel: selectedModel,
        catalog: catalogCurrent ? catalog : undefined,
      });
      if (ok) {
        setLabel("");
        setErrors({});
      }
    } finally {
      setSecret("");
      resetVerification();
      formBusy.current = false;
    }
  }
  return (
    <div className={`${base.page} ${styles.page}`}>
      <nav className={base.breadcrumb} aria-label="Provider keys breadcrumb">
        <Link href="/developer/generate">
          <ArrowLeft size={15} aria-hidden="true" />
          AI generation & jobs
        </Link>
        <span aria-current="page">Provider keys</span>
      </nav>
      <header className={base.hero}>
        <div>
          <p className={base.eyebrow}>YOUR PROVIDER. YOUR PACE.</p>
          <h1>
            Bring the key.
            <br />
            <span>Keep the craft.</span>
          </h1>
          <p>
            Connect your own AI provider, choose a default, and set a daily
            generation allowance. Your saved key is encrypted at rest; only its
            last characters appear here.
          </p>
          <div className={base.actions}>
            <a className={base.primary} href="#add-provider-key">
              Add a provider key
              <KeyRound size={16} aria-hidden="true" />
            </a>
            <Link className={base.secondary} href="/developer/generate">
              Open generation
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <button
              className={base.secondary}
              type="button"
              disabled={!!pending}
              onClick={props.onClassic}
            >
              Classic view
            </button>
          </div>
        </div>
        <svg className={base.motif} viewBox="0 0 200 150" aria-hidden="true">
          <rect x="15" y="24" width="132" height="96" rx="18" />
          <path
            className={base.draw}
            pathLength="130"
            d="M42 76a17 17 0 1 1 34 0a17 17 0 1 1-34 0m34 0h78v15m-18-15v12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="135" y="22" width="46" height="46" rx="12" />
          <path
            d="m148 44 7 7 13-15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </header>
      <div className={base.checkbar}>
        <p>
          Opening this page reads metadata only. Model checks and saved changes
          require your action.
        </p>
        <button
          className={base.secondary}
          type="button"
          disabled={!!pending}
          onClick={onCheck}
        >
          {pending === "check" ? "Checking saved keys…" : "Recheck saved keys"}
        </button>
      </div>
      {props.readError && (
        <GuiFeedback kind="error" title="Saved settings need a fresh check">
          <p>{props.readError}</p>
        </GuiFeedback>
      )}
      {props.error && (
        <GuiFeedback
          ref={errorRef}
          kind="error"
          title={
            props.uncertain ? "Saved outcome unknown" : "Change not confirmed"
          }
        >
          <p>{props.error}</p>
          <p>
            Changes are paused until a successful recheck. Your non-secret edits
            stay on this page.
          </p>
          <button
            className={base.secondary}
            disabled={!!pending}
            onClick={onCheck}
            type="button"
          >
            Recheck before continuing
          </button>
        </GuiFeedback>
      )}
      {props.notice && (
        <GuiFeedback ref={statusRef} kind="success" title="Saved state checked">
          <p>{props.notice.text}</p>
        </GuiFeedback>
      )}
      {pending && pending !== "check" && (
        <GuiFeedback
          kind="loading"
          title={
            pending === "models"
              ? "Checking provider model metadata"
              : "Saving key settings"
          }
        >
          <p>
            Wait for the request and saved-state check before another action.
          </p>
        </GuiFeedback>
      )}
      <div className={styles.workspace}>
        <section className={styles.panel} aria-labelledby="stored-keys-heading">
          <div className={base.sectionHeading}>
            <div>
              <p className={base.eyebrow}>CONNECTED TO YOUR ACCOUNT</p>
              <h2 id="stored-keys-heading">
                Your stored keys{" "}
                <span className={styles.count}>{data.keys.length}/2</span>
              </h2>
            </div>
            <KeyRound aria-hidden="true" size={24} />
          </div>
          {!data.keys.length ? (
            <div className={styles.empty}>
              <KeyRound size={28} aria-hidden="true" />
              <h3>A place for your own key.</h3>
              <p>
                Connect NVIDIA or Gemini to use your provider account. Without a
                default key, generation uses the shared Gemini service when
                configured.
              </p>
            </div>
          ) : (
            <div className={styles.keyList}>
              {data.keys.map((key) => (
                <KeyCard
                  key={key.id}
                  item={key}
                  data={data}
                  disabled={!!blocked}
                  pending={pending}
                  onAction={onAction}
                  onModels={props.onModels}
                  onDelete={() =>
                    setConfirmation({ key, snapshot: fingerprint })
                  }
                />
              ))}
            </div>
          )}
          <p className={styles.hint}>
            A default key determines the provider and allowance for new
            generation requests. Stored keys without a default do not become the
            fallback automatically. Running jobs keep their recorded settings.
          </p>
        </section>
        <aside className={styles.panel} aria-labelledby="key-allowance-heading">
          <p className={base.eyebrow}>THE CURRENT BUCKET</p>
          <h2 id="key-allowance-heading">Allowance, explained.</h2>
          {props.quotaLoading ? (
            <p role="status">Checking today’s allowance…</p>
          ) : props.quotaError ? (
            <GuiFeedback kind="info" title="Allowance unavailable">
              <p>{props.quotaError}</p>
              <p>
                You can still manage keys. Recheck after adding or choosing a
                default.
              </p>
            </GuiFeedback>
          ) : props.quota ? (
            <>
              <p className={styles.allowance}>
                {props.quota.unlimited
                  ? "No daily app limit"
                  : `${props.quota.remaining} / ${props.quota.limit}`}
              </p>
              <p>
                {props.quota.unlimited
                  ? "Admin account · provider charges still apply."
                  : `Remaining today · ${props.quota.tier === "own-key" ? "default key" : "shared service"}`}{" "}
                · {props.quota.provider.toUpperCase()}
              </p>
            </>
          ) : (
            <p>Recheck to load the current allowance.</p>
          )}
          <div className={styles.note}>
            <SlidersHorizontal size={20} aria-hidden="true" />
            <p>
              A daily cap limits app usage. It is not a provider spending limit,
              a price, or reserved capacity. Provider charges and automatic
              retry calls can still apply.
            </p>
          </div>
          <p className={styles.hint}>
            Usage follows your account timezone. Changing a cap does not reset
            usage. The shared service depends on configuration and availability.
          </p>
        </aside>
      </div>
      <section
        className={styles.panel}
        id="add-provider-key"
        aria-labelledby="add-key-heading"
      >
        <div className={base.sectionHeading}>
          <div>
            <p className={base.eyebrow}>MAKE THE CONNECTION</p>
            <h2 id="add-key-heading">Add a provider key</h2>
          </div>
          <ShieldCheck size={25} aria-hidden="true" />
        </div>
        {data.keys.length >= 2 ? (
          <GuiFeedback kind="info" title="Both key slots are in use">
            <p>
              Remove a stored key before adding another. A key used by a pending
              or running job cannot be removed.
            </p>
          </GuiFeedback>
        ) : (
          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            {Object.values(errors).some(Boolean) && (
              <div
                ref={validationRef}
                className={styles.validation}
                role="alert"
                tabIndex={-1}
              >
                <strong>Check these fields</strong>
                <ul>
                  {Object.entries(errors)
                    .filter(([, v]) => v)
                    .map(([field, text]) => (
                      <li key={field}>
                        <a
                          href={`#provider-${field}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document
                              .getElementById(`provider-${field}`)
                              ?.focus();
                          }}
                        >
                          {text}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <div className={styles.fields}>
              <div>
                <label htmlFor="provider-provider">Provider</label>
                <select
                  id="provider-provider"
                  value={provider}
                  disabled={!!pending || !!blocked}
                  aria-invalid={!!errors.provider}
                  aria-describedby={
                    errors.provider ? "provider-provider-error" : undefined
                  }
                  onChange={(e) => {
                    setProvider(e.target.value as Provider);
                    resetVerification();
                  }}
                >
                  {data.providers.map((p) => (
                    <option key={p.provider} value={p.provider}>
                      {p.displayName}
                      {p.byokOnly ? " · own key required" : ""}
                    </option>
                  ))}
                </select>
                {errors.provider && (
                  <p id="provider-provider-error" className={styles.hint}>
                    {errors.provider}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="provider-label">
                  Label <span>(optional)</span>
                </label>
                <input
                  id="provider-label"
                  maxLength={120}
                  value={label}
                  readOnly={!!pending}
                  disabled={!!blocked && !pending}
                  aria-invalid={!!errors.label}
                  aria-describedby={
                    errors.label ? "provider-label-error" : undefined
                  }
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setConsent(false);
                    setErrors({});
                  }}
                />
                {errors.label && (
                  <p id="provider-label-error" className={styles.hint}>
                    {errors.label}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="provider-secret">Full provider API key</label>
              <input
                id="provider-secret"
                type="password"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={secret}
                readOnly={!!pending}
                disabled={!!blocked && !pending}
                aria-invalid={!!errors.secret}
                aria-describedby="provider-secret-help provider-secret-error"
                onChange={(e) => {
                  setSecret(e.target.value);
                  resetVerification();
                }}
              />
              <p id="provider-secret-help" className={styles.hint}>
                Kept only in this form while you edit. Never placed in a URL,
                query cache, or browser storage. Saving verifies it with{" "}
                {providerName}, encrypts it on the service, then clears this
                input. Clearing or leaving the page discards unsaved input.
              </p>
              <p id="provider-secret-error" className={styles.hint}>
                {errors.secret}
              </p>
            </div>
            <label className={styles.consent}>
              <input
                id="provider-consent"
                type="checkbox"
                checked={consentCurrent}
                disabled={!!blocked || !!pending}
                aria-invalid={!!errors.consent}
                aria-describedby="provider-consent-help"
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setConsentSnapshot(fingerprint);
                  setErrors({});
                }}
              />
              <span>
                I agree to use this key to contact {providerName} for
                verification and model metadata. If I choose Save, store it
                encrypted in my source:dev account
                {!data.keys.length
                  ? " and use it as my default for future generation"
                  : ""}
                . Provider charges may apply to future generation.
              </span>
            </label>
            <p id="provider-consent-help" className={styles.hint}>
              {errors.consent ||
                "Verification does not store the key or start generation. Save verifies it again. This permission resets when key, provider, model or saved settings change."}
            </p>
            <div className={base.actions}>
              <button
                className={base.secondary}
                disabled={!!blocked || !!pending}
                type="button"
                onClick={() => void lookup()}
              >
                {pending === "models"
                  ? "Checking provider…"
                  : "Verify & load models"}
              </button>
              <button
                className={base.secondary}
                type="button"
                disabled={!!pending}
                onClick={() => {
                  setSecret("");
                  resetVerification();
                }}
              >
                Clear unsaved key
              </button>
            </div>
            {catalogCurrent && catalog && (
              <div className={styles.note}>
                <div>
                  <strong>
                    {catalog.live
                      ? "Live verification returned"
                      : "Curated fallback · not a live verification"}
                  </strong>
                  <p className={styles.hint}>
                    The key has not been stored yet. A model can be retired
                    later; generation may use configured fallbacks.
                  </p>
                  <label htmlFor="provider-model">
                    Default model for the new key
                  </label>
                  <select
                    id="provider-model"
                    value={selectedModel}
                    disabled={!!blocked || !!pending}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setConsent(false);
                    }}
                  >
                    <option value="">Provider default</option>
                    {catalog.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className={base.actions}>
              <button
                className={base.primary}
                disabled={!!blocked || !!pending}
                type="submit"
              >
                {pending === "create"
                  ? "Verifying & saving key…"
                  : "Save encrypted key"}
              </button>
              <p className={styles.hint}>
                New keys start with a 20/day app cap. The first stored key
                becomes the default.
              </p>
            </div>
          </form>
        )}
      </section>
      <footer className={styles.footer}>
        <ShieldCheck size={20} aria-hidden="true" />
        <p>
          Only key metadata is returned. Removing a stored key does not revoke
          it at NVIDIA or Gemini; manage provider access in your provider
          account.
        </p>
      </footer>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="key-delete-title"
        aria-describedby="key-delete-description"
        onCancel={(event) => {
          event.preventDefault();
          setConfirmation(undefined);
        }}
      >
        <h2 id="key-delete-title">Remove this stored key?</h2>
        <p id="key-delete-description">
          Remove{" "}
          {confirmation?.key.label || confirmation?.key.provider.toUpperCase()}{" "}
          ····{confirmation?.key.keyHint} from source:dev? This permanently
          removes the stored key. Reconnecting requires the full key again.{" "}
          {confirmation?.key.isDefault
            ? "New requests will use the shared Gemini service when configured; another stored key will not be selected automatically."
            : "The current default and its allowance stay in use."}{" "}
          A pending or running job using this key blocks removal. Your provider
          account key is not revoked.
        </p>
        <div className={base.actions}>
          <button
            ref={cancelRef}
            className={base.secondary}
            type="button"
            onClick={() => setConfirmation(undefined)}
          >
            Keep key
          </button>
          <button
            className={base.primary}
            type="button"
            disabled={!!blocked || !!pending || !currentConsent}
            onClick={() => {
              if (!confirmation || !currentConsent || blocked) return;
              const id = confirmation.key.id;
              setConfirmation(undefined);
              void onAction({ kind: "delete", id });
            }}
          >
            Remove stored key
          </button>
        </div>
      </dialog>
    </div>
  );
}
function KeyCard({
  item,
  data,
  disabled,
  pending,
  onAction,
  onModels,
  onDelete,
}: {
  item: ProviderKey;
  data: KeyWorkspace;
  disabled: boolean;
  pending?: string;
  onAction: ProviderKeysViewProps["onAction"];
  onModels: ProviderKeysViewProps["onModels"];
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(item.label ?? ""),
    [cap, setCap] = useState(String(item.dailyLimit)),
    [model, setModel] = useState(item.defaultModel ?? ""),
    [catalog, setCatalog] = useState<KeyCatalog>(),
    [validation, setValidation] = useState<{
      field: string;
      message: string;
    }>();
  const validationRef = useRef<HTMLDivElement>(null),
    localBusy = useRef(false),
    prefix = `key-${item.id}`;
  const catalogCurrent = catalog?.binding === keyCatalogBinding(data, item.id);
  useEffect(() => {
    if (validation) validationRef.current?.focus();
  }, [validation]);
  async function submit(action: KeyAction) {
    if (localBusy.current || disabled) return;
    localBusy.current = true;
    try {
      const ok = await onAction(action);
      if (ok) setValidation(undefined);
    } finally {
      localBusy.current = false;
    }
  }
  return (
    <article className={styles.keyCard} aria-labelledby={`${prefix}-heading`}>
      <div className={styles.keyTitle}>
        <div>
          <p className={base.eyebrow}>
            {item.provider.toUpperCase()} ····{item.keyHint}
          </p>
          <h3 id={`${prefix}-heading`}>{item.label || "Unlabelled key"}</h3>
        </div>
        <span className={styles.badge}>
          {item.isDefault ? "Default" : "Stored"}
        </span>
      </div>
      <p className={styles.hint}>
        Saved cap: {item.dailyLimit}/day · Default model:{" "}
        <span className={styles.modelName}>
          {item.defaultModel || "Provider default"}
        </span>
      </p>
      <div className={base.actions}>
        <button
          className={base.secondary}
          type="button"
          disabled={disabled}
          onClick={() =>
            void submit({
              kind: item.isDefault ? "clear-default" : "default",
              id: item.id,
            })
          }
        >
          {item.isDefault ? "Use shared service instead" : "Make default"}
        </button>
        <button
          className={base.secondary}
          type="button"
          disabled={disabled}
          onClick={onDelete}
        >
          Remove key
        </button>
      </div>
      <details>
        <summary>Edit label, cap & model</summary>
        <div className={styles.editFields}>
          {validation && (
            <div
              ref={validationRef}
              id={`${prefix}-validation`}
              role="alert"
              tabIndex={-1}
              className={styles.validation}
            >
              <a
                href={`#${prefix}-${validation.field}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(`${prefix}-${validation.field}`)
                    ?.focus();
                }}
              >
                {validation.message}
              </a>
            </div>
          )}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (label.trim().length > 120) {
                setValidation({
                  field: "label",
                  message: "Use a label of 120 characters or fewer.",
                });
                return;
              }
              void submit({ kind: "label", id: item.id, value: label });
            }}
          >
            <label htmlFor={`${prefix}-label`}>Key label</label>
            <input
              id={`${prefix}-label`}
              value={label}
              maxLength={120}
              readOnly={!!pending}
              aria-invalid={validation?.field === "label"}
              aria-describedby={
                validation?.field === "label"
                  ? `${prefix}-validation`
                  : undefined
              }
              onChange={(e) => setLabel(e.target.value)}
            />
            <button
              className={base.secondary}
              type="submit"
              disabled={disabled}
            >
              Save label
            </button>
          </form>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(cap.trim());
              if (!Number.isInteger(n) || n < 1 || n > 50) {
                setValidation({
                  field: "cap",
                  message: "Daily cap must be a whole number from 1 to 50.",
                });
                return;
              }
              void submit({ kind: "cap", id: item.id, value: n });
            }}
          >
            <label htmlFor={`${prefix}-cap`}>Daily app cap (1–50)</label>
            <input
              id={`${prefix}-cap`}
              inputMode="numeric"
              value={cap}
              readOnly={!!pending}
              aria-invalid={validation?.field === "cap"}
              aria-describedby={`${prefix}-cap-help${validation?.field === "cap" ? ` ${prefix}-validation` : ""}`}
              onChange={(e) => setCap(e.target.value)}
            />
            <p id={`${prefix}-cap-help`} className={styles.hint}>
              This changes the app allowance, not provider billing. It does not
              reset today’s usage.
            </p>
            <button
              className={base.secondary}
              type="submit"
              disabled={disabled}
            >
              Save daily cap
            </button>
          </form>
          <div>
            <button
              className={base.secondary}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (localBusy.current) return;
                localBusy.current = true;
                void onModels(item.id)
                  .then((value) => {
                    setCatalog(value);
                    setModel(item.defaultModel ?? "");
                  })
                  .finally(() => {
                    localBusy.current = false;
                  });
              }}
            >
              Load this key’s models
            </button>
            <p className={styles.hint}>
              Contacts {item.provider.toUpperCase()} with this stored key for
              model metadata. No generation starts.
            </p>
          </div>
          {catalogCurrent && catalog && (
            <GuiFeedback
              kind="info"
              title={
                catalog.live ? "Live model catalog" : "Curated fallback catalog"
              }
            >
              <p>
                {catalog.live
                  ? "Models returned by the provider."
                  : "The provider was unreachable. This is not proof the key is valid; saving a model verifies it again."}
              </p>
            </GuiFeedback>
          )}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (
                model &&
                (!catalogCurrent || !catalog?.models.includes(model))
              ) {
                setValidation({
                  field: "model",
                  message:
                    "Load this key’s current catalog before selecting a model.",
                });
                return;
              }
              void submit({
                kind: "model",
                id: item.id,
                value: model,
                catalog: catalogCurrent ? catalog : undefined,
              });
            }}
          >
            <p className={styles.hint}>
              Saving a specific model verifies it again with the provider.
              Provider default clears this key’s model override; generation may
              use configured fallbacks.
            </p>
            <label htmlFor={`${prefix}-model`}>Default model</label>
            <select
              id={`${prefix}-model`}
              value={model}
              disabled={disabled}
              aria-invalid={validation?.field === "model"}
              aria-describedby={
                validation?.field === "model"
                  ? `${prefix}-validation`
                  : undefined
              }
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="">Provider default</option>
              {item.defaultModel &&
                !catalog?.models.includes(item.defaultModel) && (
                  <option value={item.defaultModel}>
                    {item.defaultModel} · saved
                  </option>
                )}
              {catalogCurrent &&
                catalog?.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
            <button
              className={base.secondary}
              disabled={disabled}
              type="submit"
            >
              Save default model
            </button>
          </form>
        </div>
      </details>
    </article>
  );
}
