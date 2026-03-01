/**
 * Utility functions for client-side image processing
 */

/**
 * Convert a File to a data URL for use in the cropper
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a Blob to a File object for FormData submission
 */
export function blobToFile(blob: Blob, fileName: string): File {
  const extension = blob.type === "image/webp" ? ".webp" : blob.type === "image/png" ? ".png" : ".jpg";
  const finalName = fileName.replace(/\.[^.]+$/, "") + extension;
  return new File([blob], finalName, { type: blob.type });
}

/**
 * Compress an image file without cropping (for post images, etc.)
 * Returns a File that is under the maxSize limit
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeBytes?: number;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeBytes = 2 * 1024 * 1024, // 2MB default
  } = options;

  // If already small enough and not too large dimensions, return as-is
  if (file.size <= maxSizeBytes) {
    // Still check dimensions
    const img = await loadImage(file);
    if (img.width <= maxWidth && img.height <= maxHeight) {
      return file;
    }
  }

  const img = await loadImage(file);

  // Calculate new dimensions
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Try WebP first for better compression
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  // If still too large, reduce quality progressively
  let currentQuality = quality;
  while (blob.size > maxSizeBytes && currentQuality > 0.3) {
    currentQuality -= 0.1;
    blob = await canvasToBlob(canvas, "image/webp", currentQuality);
  }

  // If still too large, resize further
  if (blob.size > maxSizeBytes) {
    const scale = Math.sqrt(maxSizeBytes / blob.size);
    canvas.width = Math.round(canvas.width * scale);
    canvas.height = Math.round(canvas.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, "image/webp", 0.7);
  }

  return blobToFile(blob, file.name);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      type,
      quality
    );
  });
}
