import apiClient from "@/lib/api-client";
import { getToken, type User } from "@/lib/auth";
import {
  parseProfile,
  profileDraft,
  profileFingerprint,
  sameDraft,
  profileErrors,
  passwordErrors,
  type Profile,
  type ProfileDraft,
  type PasswordDraft,
} from "./profile-data";
export class ProfileFailure extends Error {
  constructor(
    message: string,
    public uncertain = false,
    public unavailable = false,
    public conflict = false,
  ) {
    super(message);
  }
}
const status = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;
const changed = () =>
  new ProfileFailure(
    "Your account changed or couldn’t be confirmed. Reload or sign in again before continuing.",
    false,
    true,
  );
function guardSession() {
  const token = getToken();
  if (!token) throw changed();
  return () => {
    if (getToken() !== token) throw changed();
  };
}
export async function loadProfile(
  expected?: Pick<User, "id" | "role">,
  signal?: AbortSignal,
): Promise<Profile> {
  const guard = guardSession();
  let raw: unknown;
  try {
    raw = (await apiClient.get("/users/me", { timeout: 12000, signal })).data;
  } catch (error) {
    throw new ProfileFailure(
      "Your profile couldn’t load. Check your connection and try again.",
      false,
      [401, 403, 404].includes(status(error) ?? 0),
    );
  }
  guard();
  try {
    const user = parseProfile(raw);
    if (expected && (user.id !== expected.id || user.role !== expected.role))
      throw changed();
    return user;
  } catch {
    throw changed();
  }
}
function refused(error: unknown, password = false): ProfileFailure {
  const code = status(error);
  if (code && code >= 400 && code < 500 && code !== 408)
    return new ProfileFailure(
      password
        ? "The password change was refused. Check your current password and sign-in session before trying again."
        : "The profile change was refused. Check your fields and sign-in session before trying again.",
      false,
      [401, 403, 404].includes(code),
    );
  return new ProfileFailure(
    password
      ? "The password change couldn’t be confirmed. It may have completed. Further changes are paused; use sign-in or password recovery to establish which password works."
      : "The profile save couldn’t be confirmed. It may have completed. Check saved details before another save; an earlier request may still finish.",
    true,
  );
}
export async function saveProfile(
  before: Profile,
  draft: ProfileDraft,
): Promise<Profile> {
  if (Object.keys(profileErrors(draft)).length)
    throw new ProfileFailure("Check the profile fields before saving.");
  const target = { ...draft, name: draft.name.trim() };
  const body = {
    name: target.name,
    timezone: target.timezone,
    ...(target.profilePicture !== before.profilePicture
      ? { profilePicture: target.profilePicture }
      : {}),
  };
  if (
    target.profilePicture !== before.profilePicture &&
    target.profilePicture !== null &&
    !target.profilePicture.startsWith("data:image/")
  )
    throw new ProfileFailure("Choose a local photo before saving.");
  if (sameDraft(profileDraft(before), target))
    throw new ProfileFailure("There are no changes to save.");
  const guard = guardSession();
  const current = await loadProfile(before);
  guard();
  if (profileFingerprint(current) !== profileFingerprint(before))
    throw new ProfileFailure(
      "Your saved details changed. Your edits are kept. Check the saved version before continuing.",
      false,
      false,
      true,
    );
  let raw: unknown;
  try {
    raw = (await apiClient.patch("/users/me", body, { timeout: 12000 })).data;
  } catch (error) {
    const failure = refused(error);
    try {
      guard();
    } catch {
      failure.unavailable = true;
    }
    throw failure;
  }
  try {
    guard();
    const saved = parseProfile(raw);
    if (
      saved.id !== before.id ||
      saved.role !== before.role ||
      saved.email !== before.email ||
      !sameDraft(profileDraft(saved), target)
    )
      throw new Error();
    const checked = await loadProfile(before);
    guard();
    if (profileFingerprint(saved) !== profileFingerprint(checked))
      throw new Error();
    return checked;
  } catch (error) {
    throw new ProfileFailure(
      "The save response and saved details couldn’t both be confirmed. Check saved details before saving again; an earlier request may still finish.",
      true,
      error instanceof ProfileFailure && error.unavailable,
    );
  }
}
export async function changeProfilePassword(
  before: Profile,
  draft: PasswordDraft,
): Promise<void> {
  if (Object.keys(passwordErrors(draft)).length)
    throw new ProfileFailure("Check the password fields before continuing.");
  const guard = guardSession();
  const current = await loadProfile(before);
  guard();
  if (current.email !== before.email || !current.hasPassword) throw changed();
  let raw: unknown;
  try {
    raw = (
      await apiClient.patch(
        "/users/me/password",
        {
          currentPassword: draft.currentPassword,
          newPassword: draft.newPassword,
        },
        { timeout: 12000 },
      )
    ).data;
  } catch (error) {
    const failure = refused(error, true);
    try {
      guard();
    } catch {
      failure.unavailable = true;
    }
    throw failure;
  }
  try {
    guard();
    if (
      !raw ||
      typeof raw !== "object" ||
      (raw as { message?: unknown }).message !== "Password updated successfully"
    )
      throw new Error();
  } catch (error) {
    throw new ProfileFailure(
      "The password change couldn’t be confirmed. It may have completed. Further changes are paused; use sign-in or password recovery to establish which password works.",
      true,
      error instanceof ProfileFailure && error.unavailable,
    );
  }
}
