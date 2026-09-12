/**
 * Avatar image processing.
 *
 * Extracted from app/profile/page.tsx so the terminal `profile avatar set`
 * command and the profile page's file picker produce identical output — same
 * crop, same dimensions, same quality — rather than drifting apart.
 */

/** Accepted input types, matching the `accept` attribute on both pickers. */
export const AVATAR_MIME = /^image\/(jpeg|png|webp|jpg)$/;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";

/** Center-crop to a 256×256 JPEG data URI at quality 0.82, which lands well
 *  under the 500KB the profile page advertises. */
export function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(AVATAR_MIME)) {
      reject(new Error("Please select a valid image file (JPEG, PNG, or WebP)."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to process image canvas."));
          return;
        }

        // Center crop to 256x256
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);

        // Export as compressed JPEG
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Failed to render selected image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () =>
      reject(new Error("Failed to read selected image file."));
    reader.readAsDataURL(file);
  });
}

/** Approximate encoded size of a data URI, in KB. */
export function dataUrlSizeKb(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round(Math.round((base64.length * 3) / 4) / 1024);
}
