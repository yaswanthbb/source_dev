"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { GuiFeedback } from "@/components/gui/gui-feedback";
import {
  TIMEZONES,
  emptyPassword,
  passwordErrors,
  profileDraft,
  profileErrors,
  sameDraft,
  preparePicture,
  type PasswordDraft,
  type Profile,
  type ProfileDraft,
} from "./profile-data";
import styles from "./profile.module.css";
export interface ProfileViewProps {
  user?: Profile;
  draft: ProfileDraft;
  onDraft: (draft: ProfileDraft) => void;
  loading?: boolean;
  pending?: "profile" | "password" | "check";
  blocked?: boolean;
  locked?: boolean;
  passwordLocked?: boolean;
  review?: Profile;
  earlierRequest?: boolean;
  error?: string;
  passwordError?: string;
  notice?: string;
  passwordNotice?: string;
  onSave: (draft: ProfileDraft) => void;
  onPassword: (draft: PasswordDraft) => void;
  onCheck: () => void;
  onAdopt: (keep: boolean) => void;
}
export function ProfileView(props: ProfileViewProps) {
  const { user, draft } = props;
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [password, setPassword] = useState(emptyPassword),
    [secretErrors, setSecretErrors] = useState<Record<string, string>>({}),
    [visible, setVisible] = useState<Record<string, boolean>>({}),
    [processing, setProcessing] = useState(false),
    [photoError, setPhotoError] = useState(""),
    [dialog, setDialog] = useState<"password" | "discard" | "replace">();
  const file = useRef<HTMLInputElement>(null),
    summary = useRef<HTMLDivElement>(null),
    secretSummary = useRef<HTMLDivElement>(null),
    dialogRef = useRef<HTMLDialogElement>(null),
    cancelRef = useRef<HTMLButtonElement>(null),
    sequence = useRef(0);
  const dirty = !!user && !sameDraft(profileDraft(user), draft),
    secrets = Object.values(password).some(Boolean),
    disabled = !!props.pending || processing || !user;
  useEffect(
    () => () => {
      sequence.current++;
    },
    [],
  );
  useEffect(() => {
    if (!dirty && !secrets && !props.pending && !processing) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, secrets, props.pending, processing]);
  useEffect(() => {
    if (Object.keys(errors).length) summary.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (Object.keys(secretErrors).length) secretSummary.current?.focus();
  }, [secretErrors]);
  useEffect(() => {
    if (!dialog || !dialogRef.current) return;
    const element = dialogRef.current,
      previous = document.activeElement as HTMLElement | null;
    element.showModal();
    cancelRef.current?.focus();
    return () => {
      element.close();
      previous?.focus();
    };
  }, [dialog]);
  async function picture(selected?: File) {
    if (!selected || disabled) return;
    const version = ++sequence.current;
    setProcessing(true);
    setPhotoError("");
    try {
      const data = await preparePicture(selected);
      if (version === sequence.current)
        props.onDraft({ ...draft, profilePicture: data });
    } catch (failure) {
      if (version === sequence.current)
        setPhotoError(
          failure instanceof Error
            ? failure.message
            : "This photo couldn’t be opened. Try another image.",
        );
    } finally {
      if (version === sequence.current) {
        setProcessing(false);
        if (file.current) file.current.value = "";
      }
    }
  }
  function confirm() {
    if (disabled) return;
    if (dialog === "password") {
      if (props.blocked || props.passwordLocked || !user?.hasPassword) {
        setDialog(undefined);
        return;
      }
      const found = passwordErrors(password);
      if (Object.keys(found).length) {
        setSecretErrors(found);
        setDialog(undefined);
        return;
      }
      const value = { ...password };
      setPassword(emptyPassword());
      setVisible({});
      setDialog(undefined);
      props.onPassword(value);
    } else if (dialog === "discard" && user) {
      props.onDraft(profileDraft(user));
      setErrors({});
      setPhotoError("");
      setDialog(undefined);
    } else if (dialog === "replace" && props.review) {
      props.onAdopt(false);
      setErrors({});
      setDialog(undefined);
    }
  }
  const errorSummary = (fields: Record<string, string>, prefix: string) => (
    <ul>
      {Object.entries(fields).map(([key, value]) => (
        <li key={key}>
          <a
            href={`#${prefix}${key}`}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(`${prefix}${key}`)?.focus();
            }}
          >
            {value}
          </a>
        </li>
      ))}
    </ul>
  );
  const provider =
    user?.authProvider === "google"
      ? "Google"
      : user?.authProvider === "github"
        ? "GitHub"
        : user?.authProvider
          ? "Social sign-in"
          : "Email and password";
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link
          className={styles.back}
          href={
            user?.role === "admin" ? "/admin/dashboard" : "/developer/dashboard"
          }
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to overview
        </Link>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.eyebrow}>YOUR ACCOUNT</p>
            <h1>
              A little more <span>you.</span>
            </h1>
            <p>
              Your profile, your local time, your peace of mind.
              <br />
              Keep the details that follow you up to date.
            </p>
          </div>
          <ProfileIllustration />
        </div>
      </header>
      {props.loading ? (
        <GuiFeedback kind="loading" title="Loading your profile">
          Checking your saved details and sign-in methods.
        </GuiFeedback>
      ) : !user ? (
        <GuiFeedback kind="error" title="Profile unavailable">
          <p>{props.error || "Your account details couldn’t load."}</p>
          <button
            type="button"
            onClick={props.onCheck}
            disabled={!!props.pending}
          >
            {props.pending === "check" ? "Checking…" : "Try again"}
          </button>
        </GuiFeedback>
      ) : (
        <div className={styles.layout}>
          <div className={styles.forms}>
            {props.error && (
              <GuiFeedback
                kind="error"
                title={
                  props.locked
                    ? "Profile saves are paused"
                    : "Profile couldn’t be saved"
                }
              >
                <p>{props.error}</p>
              </GuiFeedback>
            )}
            {props.notice && (
              <GuiFeedback kind="success" title={props.notice} />
            )}
            {props.earlierRequest && (
              <GuiFeedback kind="info" title="An earlier save may still finish">
                Checking saved details cannot cancel a request already sent.
                Review the latest details before saving again.
              </GuiFeedback>
            )}
            {props.locked && (
              <section
                className={styles.recovery}
                aria-labelledby="profile-check-title"
              >
                <h2 id="profile-check-title">Check before continuing</h2>
                <p>Your edits stay here while you check the saved profile.</p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={props.onCheck}
                >
                  {props.pending === "check"
                    ? "Checking saved details…"
                    : "Check saved details"}
                </button>
                {props.review && (
                  <div className={styles.review}>
                    <h3>Latest saved details</h3>
                    <dl>
                      <dt>Name</dt>
                      <dd>{props.review.name}</dd>
                      <dt>Timezone</dt>
                      <dd>{props.review.timezone}</dd>
                      <dt>Photo</dt>
                      <dd>
                        {props.review.profilePicture === draft.profilePicture
                          ? "Matches your current edit"
                          : props.review.profilePicture
                            ? "A different photo is saved"
                            : "No saved photo"}
                      </dd>
                    </dl>
                    <p>
                      Keep your edits to review and save again, or replace them
                      with these saved details.
                    </p>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => props.onAdopt(true)}
                      >
                        Keep my edits
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setDialog("replace")}
                      >
                        Use saved details
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
            <form
              className={styles.card}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (disabled || props.blocked) return;
                const found = profileErrors(draft);
                setErrors(found);
                if (!Object.keys(found).length) props.onSave(draft);
              }}
              aria-labelledby="profile-details-title"
              aria-busy={props.pending === "profile"}
            >
              <div className={styles.sectionHeading}>
                <span>
                  <UserRound size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="profile-details-title">Profile details</h2>
                  <p>Make yourself at home.</p>
                </div>
                <span className={styles.sectionNumber}>01</span>
              </div>
              {Object.keys(errors).length > 0 && (
                <GuiFeedback
                  ref={summary}
                  kind="error"
                  title="Check your profile details"
                >
                  {errorSummary(errors, "profile-")}
                </GuiFeedback>
              )}
              <fieldset disabled={disabled} className={styles.fields}>
                <legend className={styles.srOnly}>Your profile</legend>
                <div className={styles.photoRow}>
                  <span className={styles.avatar}>
                    {draft.profilePicture ? (
                      <Photo
                        key={draft.profilePicture}
                        src={draft.profilePicture}
                      />
                    ) : (
                      <span aria-hidden="true">
                        {draft.name.trim().charAt(0).toUpperCase() || (
                          <UserRound size={30} />
                        )}
                      </span>
                    )}
                  </span>
                  <div>
                    <label htmlFor="profile-profilePicture">
                      Profile photo
                    </label>
                    <p>
                      JPEG, PNG or WebP, up to 10 MB.
                      <br />
                      Centered and cropped to 256 × 256.
                    </p>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => file.current?.click()}
                      >
                        <Camera size={15} aria-hidden="true" />
                        {processing ? "Preparing photo…" : "Choose photo"}
                      </button>
                      {draft.profilePicture && (
                        <button
                          type="button"
                          onClick={() => {
                            sequence.current++;
                            props.onDraft({ ...draft, profilePicture: null });
                            setPhotoError("");
                          }}
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                    <input
                      ref={file}
                      className={styles.file}
                      id="profile-profilePicture"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-invalid={!!errors.profilePicture}
                      aria-describedby={
                        errors.profilePicture
                          ? "profile-photo-error photo-help"
                          : "photo-help"
                      }
                      onChange={(event) =>
                        void picture(event.target.files?.[0])
                      }
                    />
                    <p id="photo-help">
                      Photo changes take effect when you save.
                    </p>
                  </div>
                </div>
                {photoError && (
                  <p role="alert" className={styles.fieldError}>
                    {photoError}
                  </p>
                )}
                {processing && (
                  <p role="status">Preparing your photo locally…</p>
                )}
                {errors.profilePicture && (
                  <p id="profile-photo-error" className={styles.fieldError}>
                    {errors.profilePicture}
                  </p>
                )}
                <div className={styles.field}>
                  <label htmlFor="profile-name">Your name</label>
                  <input
                    id="profile-name"
                    autoComplete="name"
                    maxLength={100}
                    value={draft.name}
                    aria-invalid={!!errors.name}
                    aria-describedby={
                      errors.name ? "profile-name-error" : undefined
                    }
                    onChange={(event) =>
                      props.onDraft({ ...draft, name: event.target.value })
                    }
                  />
                  {errors.name && (
                    <p id="profile-name-error" className={styles.fieldError}>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-email">
                    Email address{" "}
                    <span className={styles.readOnly}>Read only</span>
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    autoComplete="username"
                    readOnly
                    value={user.email}
                    aria-describedby="profile-email-help"
                  />
                  <p id="profile-email-help">
                    This is the email linked to your sign-in.
                  </p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="profile-timezone">Timezone</label>
                  <select
                    id="profile-timezone"
                    value={draft.timezone}
                    aria-invalid={!!errors.timezone}
                    aria-describedby={
                      errors.timezone
                        ? "profile-timezone-error"
                        : "profile-timezone-help"
                    }
                    onChange={(event) =>
                      props.onDraft({ ...draft, timezone: event.target.value })
                    }
                  >
                    {[
                      ...new Set([
                        ...(TIMEZONES.includes(user.timezone)
                          ? []
                          : [user.timezone]),
                        ...TIMEZONES,
                      ]),
                    ].map((zone) => (
                      <option key={zone} value={zone}>
                        {zone.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  {errors.timezone ? (
                    <p
                      id="profile-timezone-error"
                      className={styles.fieldError}
                    >
                      {errors.timezone}
                    </p>
                  ) : (
                    <p id="profile-timezone-help">
                      <Clock3 size={13} aria-hidden="true" /> Choose the
                      timezone for your account.
                    </p>
                  )}
                </div>
              </fieldset>
              <div className={styles.saveBar}>
                <span>
                  <span className={dirty ? styles.dirtyDot : styles.savedDot} />
                  {processing
                    ? "Preparing photo"
                    : dirty
                      ? "Unsaved changes"
                      : "Up to date"}
                </span>
                <div className={styles.actions}>
                  <button
                    type="button"
                    disabled={!dirty || disabled}
                    onClick={() => setDialog("discard")}
                  >
                    Discard edits
                  </button>
                  <button
                    className={styles.primary}
                    type="submit"
                    disabled={!dirty || disabled || props.blocked}
                  >
                    <Save size={15} aria-hidden="true" />
                    {props.pending === "profile"
                      ? "Saving profile…"
                      : "Save profile"}
                  </button>
                </div>
              </div>
            </form>
            <section
              className={styles.card}
              aria-labelledby="profile-security-title"
            >
              <div className={styles.sectionHeading}>
                <span>
                  <LockKeyhole size={19} aria-hidden="true" />
                </span>
                <div>
                  <h2 id="profile-security-title">Password & security</h2>
                  <p>A fresh password, when you need one.</p>
                </div>
                <span className={styles.sectionNumber}>02</span>
              </div>
              {props.passwordError && (
                <GuiFeedback
                  kind="error"
                  title={
                    props.passwordLocked
                      ? "Password changes are paused"
                      : "Password couldn’t be changed"
                  }
                >
                  <p>{props.passwordError}</p>
                  {props.passwordLocked && (
                    <p>
                      <Link href="/login">Go to sign-in</Link> or{" "}
                      <Link href="/forgot-password">recover your password</Link>
                      . A profile read cannot verify which password works.
                    </p>
                  )}
                </GuiFeedback>
              )}
              {props.passwordNotice && (
                <GuiFeedback kind="success" title={props.passwordNotice} />
              )}
              {user.hasPassword ? (
                <form
                  noValidate
                  aria-busy={props.pending === "password"}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (disabled || props.blocked || props.passwordLocked)
                      return;
                    const found = passwordErrors(password);
                    setSecretErrors(found);
                    if (!Object.keys(found).length) setDialog("password");
                  }}
                >
                  {Object.keys(secretErrors).length > 0 && (
                    <GuiFeedback
                      ref={secretSummary}
                      kind="error"
                      title="Check your password fields"
                    >
                      {errorSummary(secretErrors, "security-")}
                    </GuiFeedback>
                  )}
                  <fieldset
                    disabled={disabled || props.passwordLocked}
                    className={styles.fields}
                  >
                    <legend className={styles.srOnly}>
                      Change your password
                    </legend>
                    {(
                      [
                        [
                          "currentPassword",
                          "Current password",
                          "current-password",
                        ],
                        ["newPassword", "New password", "new-password"],
                        [
                          "confirmPassword",
                          "Confirm new password",
                          "new-password",
                        ],
                      ] as const
                    ).map(([key, label, complete]) => (
                      <div className={styles.field} key={key}>
                        <label htmlFor={`security-${key}`}>{label}</label>
                        <div className={styles.passwordInput}>
                          <input
                            id={`security-${key}`}
                            type={visible[key] ? "text" : "password"}
                            autoComplete={complete}
                            value={password[key]}
                            spellCheck={false}
                            autoCapitalize="none"
                            aria-invalid={!!secretErrors[key]}
                            aria-describedby={
                              secretErrors[key]
                                ? `security-${key}-error`
                                : key === "newPassword"
                                  ? "security-new-help"
                                  : undefined
                            }
                            onChange={(event) =>
                              setPassword({
                                ...password,
                                [key]: event.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            aria-label={`${visible[key] ? "Hide" : "Show"} ${label.toLowerCase()}`}
                            aria-pressed={!!visible[key]}
                            onClick={() =>
                              setVisible({ ...visible, [key]: !visible[key] })
                            }
                          >
                            {visible[key] ? (
                              <EyeOff size={17} aria-hidden="true" />
                            ) : (
                              <Eye size={17} aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        {secretErrors[key] ? (
                          <p
                            className={styles.fieldError}
                            id={`security-${key}-error`}
                          >
                            {secretErrors[key]}
                          </p>
                        ) : (
                          key === "newPassword" && (
                            <p id="security-new-help">
                              At least 8 characters. Choose a password you don’t
                              use elsewhere.
                            </p>
                          )
                        )}
                      </div>
                    ))}
                  </fieldset>
                  <div className={styles.saveBar}>
                    <span>Saved separately from your profile.</span>
                    <button
                      type="submit"
                      className={styles.primary}
                      disabled={
                        disabled || props.blocked || props.passwordLocked
                      }
                    >
                      <LockKeyhole size={15} aria-hidden="true" />
                      {props.pending === "password"
                        ? "Changing password…"
                        : "Change password"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.socialNotice}>
                  <ShieldCheck size={22} aria-hidden="true" />
                  <div>
                    <h3>You sign in with {provider}</h3>
                    <p>
                      This account has no password to change here. Manage your
                      password with your sign-in provider.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
          <aside className={styles.sidebar} aria-label="Account information">
            <section className={styles.identity}>
              <span className={styles.miniAvatar}>
                <UserRound size={23} aria-hidden="true" />
              </span>
              <p className={styles.eyebrow}>GOOD TO SEE YOU</p>
              <h2>{user.name || "Your account"}</h2>
              <p>{user.email}</p>
              <span className={styles.role}>
                {user.role === "admin" ? "Administrator" : "Developer"}
              </span>
              <hr />
              <div className={styles.verified}>
                <ShieldCheck size={17} aria-hidden="true" />
                <div>
                  <strong>Sign-in method</strong>
                  <span>
                    {provider}
                    {user.authProvider && user.hasPassword ? " + password" : ""}
                  </span>
                </div>
              </div>
              <p className={styles.small}>
                Sign-in connections are managed by your account. There are no
                connection changes on this page.
              </p>
            </section>
            <section className={styles.tip}>
              <span className={styles.eyebrow}>
                A SPACE THAT FEELS LIKE YOU
              </span>
              <h2>
                Light or dark.
                <br />
                Your call.
              </h2>
              <p>
                Use the theme control in your workspace navigation to change the
                appearance on this browser.
              </p>
              <span className={styles.swatches} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </section>
            <p className={styles.localNote}>
              <Check size={15} aria-hidden="true" />
              Profile edits stay on this page until you save. Leaving the page
              can discard them.
            </p>
            <Link
              className={styles.helpLink}
              href={
                user.role === "admin"
                  ? "/admin/dashboard"
                  : "/developer/dashboard"
              }
            >
              Back to your workspace
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="profile-dialog-title"
        aria-describedby="profile-dialog-description"
        onCancel={(event) => {
          event.preventDefault();
          setDialog(undefined);
        }}
      >
        <span className={styles.dialogIcon}>
          <ShieldCheck size={24} aria-hidden="true" />
        </span>
        <h2 id="profile-dialog-title">
          {dialog === "password"
            ? "Change your password?"
            : dialog === "discard"
              ? "Discard your profile edits?"
              : "Use the saved details?"}
        </h2>
        <p id="profile-dialog-description">
          {dialog === "password"
            ? "This changes your account password immediately. Your profile edits are saved separately. Password fields will be cleared after you continue."
            : dialog === "discard"
              ? "Your unsaved name, timezone and photo changes will be replaced with your last checked saved details."
              : "Your local name, timezone and photo edits will be replaced with the checked saved version. This does not send a save."}
        </p>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            onClick={() => setDialog(undefined)}
          >
            Keep editing
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={disabled}
            onClick={confirm}
          >
            {dialog === "password"
              ? "Confirm password change"
              : dialog === "discard"
                ? "Discard edits"
                : "Use saved details"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
function Photo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <UserRound size={30} aria-label="Photo unavailable" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- Local previews bypass the image proxy.
    <img
      key={src}
      src={src}
      alt="Your profile photo preview"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
function ProfileIllustration() {
  return (
    <svg
      className={styles.illustration}
      width="150"
      height="135"
      viewBox="0 0 150 135"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="76" cy="67" r="55" fill="var(--gui-accent-soft)" />
      <g className={styles.paper}>
        <rect
          x="32"
          y="17"
          width="88"
          height="103"
          rx="14"
          fill="var(--gui-surface)"
          stroke="var(--gui-border)"
          strokeWidth="1.5"
          transform="rotate(6 76 68)"
        />
        <circle cx="76" cy="50" r="15" fill="var(--gui-accent-soft)" />
        <path
          d="M57 85c0-11 8-20 19-20s19 9 19 20"
          stroke="var(--gui-accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M62 100h28"
          stroke="var(--gui-border)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="76"
          cy="47"
          r="6"
          stroke="var(--gui-accent)"
          strokeWidth="2"
        />
      </g>
      <circle cx="120" cy="101" r="15" fill="var(--gui-accent)" />
      <path
        d="m114 101 4 4 8-9"
        stroke="var(--gui-bg)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 30v10m-5-5h10M128 39v8m-4-4h8"
        stroke="var(--gui-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
