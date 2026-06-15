import { SUPABASE_ENABLED, createClient } from "@/lib/supabase/client";

/**
 * Compress an image File into a downscaled JPEG data URL. Loads the file into
 * an Image element via an object URL, draws it onto a canvas scaled so the
 * longest side is at most `maxPx`, and exports as JPEG at the given quality.
 *
 * Returns the original file as a data URL fallback when not running in a
 * browser (no `document`), so this is safe to import on the server.
 */
export function compressImage(file: File, maxPx = 900, quality = 0.72): Promise<string> {
  if (typeof document === "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(img.width, img.height);
      const scale = longest > maxPx ? maxPx / longest : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Persist a progress photo. When Supabase is configured it uploads to the
 * public `progress-photos` Storage bucket and returns the public URL; otherwise
 * (or if the upload fails) it returns a compressed JPEG data URL so the photo
 * stays well within the localStorage quota.
 */
export async function uploadProgressPhoto(file: File): Promise<string> {
  if (SUPABASE_ENABLED) {
    try {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("progress-photos")
        .upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("progress-photos").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return compressImage(file);
    }
  }
  return compressImage(file);
}

/**
 * Persist a wallpaper image. Uploads to the public `wallpapers` Storage bucket
 * when Supabase is configured (returning the public URL); otherwise returns a
 * larger compressed JPEG data URL suitable for a full-screen background.
 */
export async function uploadWallpaper(file: File): Promise<string> {
  if (SUPABASE_ENABLED) {
    try {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("wallpapers").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("wallpapers").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return compressImage(file, 1600, 0.78);
    }
  }
  return compressImage(file, 1600, 0.78);
}
