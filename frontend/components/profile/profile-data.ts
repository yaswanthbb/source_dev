import type { User } from "@/lib/auth";
export type Profile = User & {
  timezone: string;
  profilePicture: string | null;
  hasPassword: boolean;
};
export interface ProfileDraft {
  name: string;
  timezone: string;
  profilePicture: string | null;
}
export interface PasswordDraft {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export const emptyPassword = (): PasswordDraft => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
export const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];
export function validTimezone(value: string) {
  try {
    if (!value.trim()) return false;
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
export function safePicture(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 683000) return false;
  if (
    /^data:image\/(?:jpeg|png|webp|jpg);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      value,
    )
  )
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function parseProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") throw new Error("Incomplete profile");
  const row = raw as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(row.id) ||
    typeof row.name !== "string" ||
    typeof row.email !== "string" ||
    !row.email ||
    (row.role !== "developer" && row.role !== "admin") ||
    typeof row.hasPassword !== "boolean" ||
    typeof row.timezone !== "string" ||
    !validTimezone(row.timezone) ||
    !safePicture(row.profilePicture) ||
    (row.authProvider != null && typeof row.authProvider !== "string")
  )
    throw new Error("Incomplete profile");
  const preferences =
    row.preferences && typeof row.preferences === "object"
      ? (row.preferences as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    timezone: row.timezone,
    profilePicture: row.profilePicture,
    hasPassword: row.hasPassword,
    authProvider:
      typeof row.authProvider === "string" ? row.authProvider : null,
    ...(typeof row.createdAt === "string" ? { createdAt: row.createdAt } : {}),
    preferences: {
      ...(preferences.uiMode === "gui" || preferences.uiMode === "cli"
        ? { uiMode: preferences.uiMode }
        : {}),
      ...(typeof preferences.themeId === "string"
        ? { themeId: preferences.themeId }
        : {}),
      ...(typeof preferences.lastLocation === "string"
        ? { lastLocation: preferences.lastLocation }
        : {}),
      ...(typeof preferences.hasSeenCliNudge === "boolean"
        ? { hasSeenCliNudge: preferences.hasSeenCliNudge }
        : {}),
      ...(typeof preferences.hasSeenCliWelcome === "boolean"
        ? { hasSeenCliWelcome: preferences.hasSeenCliWelcome }
        : {}),
    },
  };
}
export const profileDraft = (user: Profile): ProfileDraft => ({
  name: user.name,
  timezone: user.timezone,
  profilePicture: user.profilePicture,
});
export const profileFingerprint = (user: Profile) =>
  JSON.stringify([
    user.id,
    user.role,
    user.email,
    user.name,
    user.timezone,
    user.profilePicture,
    user.hasPassword,
    user.authProvider,
  ]);
export const sameDraft = (a: ProfileDraft, b: ProfileDraft) =>
  a.name === b.name &&
  a.timezone === b.timezone &&
  a.profilePicture === b.profilePicture;
export function profileErrors(draft: ProfileDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Enter your name.";
  else if (draft.name.trim().length > 100)
    errors.name = "Use 100 characters or fewer.";
  if (!validTimezone(draft.timezone))
    errors.timezone = "Choose a valid timezone.";
  if (!safePicture(draft.profilePicture))
    errors.profilePicture = "Choose a JPEG, PNG or WebP photo.";
  return errors;
}
export function passwordErrors(draft: PasswordDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.currentPassword)
    errors.currentPassword = "Enter your current password.";
  if (draft.newPassword.length < 8)
    errors.newPassword = "Use at least 8 characters.";
  else if (draft.newPassword === draft.currentPassword)
    errors.newPassword = "Choose a different password.";
  if (!draft.confirmPassword || draft.confirmPassword !== draft.newPassword)
    errors.confirmPassword = "Enter the same new password again.";
  return errors;
}
/** Local decode/crop only. No upload occurs until Save profile. */
export async function preparePicture(file: File): Promise<string> {
  if (
    !/^image\/(jpeg|jpg|png|webp)$/.test(file.type) ||
    file.size === 0 ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("Choose a JPEG, PNG or WebP photo up to 10 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This photo couldn’t be opened. Try another image.");
  });
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 40000000
    )
      throw new Error("Choose a photo with at most 40 million pixels.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo processing is unavailable in this browser.");
    const side = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, 256, 256);
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      256,
      256,
    );
    const result = canvas.toDataURL("image/jpeg", 0.82);
    if (!result.startsWith("data:image/jpeg;base64,") || !safePicture(result))
      throw new Error("This photo couldn’t be prepared. Try another image.");
    return result;
  } finally {
    bitmap.close();
  }
}
