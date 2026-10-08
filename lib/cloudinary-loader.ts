import type { ImageLoaderProps } from "next/image";

// The source URL already contains f_auto,q_auto and crop settings. Next/Image
// requests device-specific widths through this loader, served by Cloudinary.
export default function cloudinaryLoader({ src, width }: ImageLoaderProps) {
  return src.replace(/w_\d+/, `w_${width}`);
}
