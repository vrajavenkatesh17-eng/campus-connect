/**
 * Campus Connect — Client-Side Image Optimizer
 * Resizes images to max 1600px on the longest side, converts to WebP (q=0.82),
 * and strips all EXIF/metadata via HTML5 Canvas redraw (free-tier friendly).
 */

export async function optimizeImageToWebP(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
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

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas 2D context unavailable for image optimization.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('Failed to encode optimized WebP image.'));
              return;
            }
            const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
            const optimizedFile = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve({
              file: optimizedFile,
              width,
              height,
              originalSize: file.size,
              optimizedSize: optimizedFile.size,
            });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode image file.'));
    };

    img.src = objectUrl;
  });
}
