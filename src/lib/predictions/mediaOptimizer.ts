/**
 * Client-Side Media Optimizer & Privacy Guard
 * Strips EXIF metadata, resizes dimensions, and transcodes images to WebP.
 * Drastically reduces bandwidth egress and database storage bloat.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export async function compressAndStripImage(
  file: File,
  maxDimension = 1080,
  quality = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    // 1. Guard against non-image types
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Invalid image file format'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate proportional scale down
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
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
          // Fallback if canvas context fails
          return resolve({
            dataUrl: e.target?.result as string,
            width,
            height,
            sizeBytes: file.size,
          });
        }

        // Offscreen canvas redraw completely strips camera/phone GPS and EXIF tags
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP format with quality compression
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          // Fallback to JPEG if browser doesn't support WebP export
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const sizeBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          width,
          height,
          sizeBytes,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
