import Image from "next/image";
import type { CSSProperties } from "react";

type TintedLogoProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
};

/**
 * A logo image that the active palette can recolour. The original artwork
 * stays in place (for layout and alt text); when the palette sets
 * --l-logo-tint-display: block, a solid tint masked to the logo's shape
 * covers it. Palettes that keep the original colours leave it untouched.
 */
export function TintedLogo({ src, alt, width, height, sizes, className = "" }: TintedLogoProps) {
  return (
    <span className={`l-tinted ${className}`} style={{ "--l-mask": `url(${src})` } as CSSProperties}>
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} />
    </span>
  );
}
