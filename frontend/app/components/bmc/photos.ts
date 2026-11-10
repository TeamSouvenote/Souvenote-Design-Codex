// Photo helpers for the Photo stage: filter to accepted types and make a small
// JPEG thumbnail so the questionnaire can show the photo again after a reload.
// The full-size file is only held in memory until it is uploaded.

import { LIMITS } from "./catalog";

export function acceptedPhotos(list: FileList | File[] | null): File[] {
  return Array.from(list || []).filter((file) => (LIMITS.acceptedImageTypes as readonly string[]).includes(file.type));
}

let photoCounter = 0;

export function photoId() {
  photoCounter += 1;
  return `ref_${Date.now().toString(36)}_${photoCounter}`;
}

export function makeThumbnail(file: File, maxSide = 220): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { URL.revokeObjectURL(url); resolve(undefined); return; }
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(undefined); };
    img.src = url;
  });
}
