// Compression d'image côté navigateur AVANT upload. Une photo de smartphone fait 3 à 8 Mo ;
// on la redimensionne (max 1600 px) et on la ré-encode en JPEG ~0,8, ce qui donne ~200 à 400 Ko.
// Gains : upload beaucoup plus rapide (crucial en 4G sur chantier), moins de stockage et
// d'egress R2, vignettes légères côté client. Non bloquant : si quoi que ce soit échoue
// (format exotique type HEIC non décodable, canvas indisponible), on renvoie le fichier d'origine.
export async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/") || typeof document === "undefined") return file;
  // Les petites images (déjà < 500 Ko) ne valent pas le recodage.
  if (file.size < 500 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file; // aucun gain : on garde l'original

    const name = file.name.replace(/\.(png|webp|heic|heif|gif|bmp|tiff?)$/i, ".jpg");
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
