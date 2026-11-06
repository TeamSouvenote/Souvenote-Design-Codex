import Image from "next/image";

type TintedLogoProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
};

/**
 * A logo in the landing's colours. `src` must be pre-tinted artwork
 * (/assets/wordmark-gold.png, or /assets/logomark-gold-silver.png: gold "S"
 * with a platinum note), shown as a plain image. No CSS masks or hidden
 * layers, so it stays visible with reduced motion, high-contrast mode, and
 * any browser that lacks mask support.
 */
export function TintedLogo({ src, alt, width, height, sizes, className = "" }: TintedLogoProps) {
  return (
    <span className={`l-tinted ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} />
    </span>
  );
}
