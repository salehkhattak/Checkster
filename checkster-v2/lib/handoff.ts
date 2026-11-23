// Passes a photo picked on the home page to the /check page.
// (Client-side navigation keeps this module in memory; the photo never leaves the phone.)

let pendingPhoto: string | null = null;

export function setPendingPhoto(url: string) {
  pendingPhoto = url;
}

export function takePendingPhoto(): string | null {
  const p = pendingPhoto;
  pendingPhoto = null;
  return p;
}
