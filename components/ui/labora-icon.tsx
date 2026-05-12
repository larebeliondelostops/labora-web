import type { ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type LaboraIconVariant = "original" | "upscaled";

interface LaboraIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  name: string;
  variant?: LaboraIconVariant;
}

export function LaboraIcon({
  name,
  variant = "upscaled",
  alt = "",
  className,
  ...props
}: LaboraIconProps) {
  const folder = variant === "upscaled" ? "upscaled_8x_png" : "original_png";
  const suffix = variant === "upscaled" ? "_8x" : "";
  const src = `/icons/labora/${folder}/${name}${suffix}.png`;

  return (
    <img
      src={src}
      alt={alt}
      className={cn("inline-block h-5 w-5 object-contain", className)}
      loading="lazy"
      {...props}
    />
  );
}
