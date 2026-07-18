function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona y comprime una foto (típicamente de la cámara del celular, que puede pesar
 * varios MB a resolución completa) a un JPEG liviano antes de guardarla en el estado de la
 * planilla. Esto evita quedarse sin memoria al mostrar miniaturas / generar el PDF, y evita
 * superar el límite de tamaño de las peticiones al guardar en el servidor.
 *
 * Si algo falla (navegador sin soporte de canvas, imagen corrupta, etc.) devuelve la imagen
 * original sin comprimir, para no bloquear al usuario.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.75
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
