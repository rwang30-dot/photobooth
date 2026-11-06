export type BorderTheme = "white" | "black" | "cream" | "pink";
export type FilterType = "normal" | "bw" | "vintage" | "cool";

export interface StripOptions {
  theme: BorderTheme;
  filter: FilterType;
  customCaption?: string;
  showDate?: boolean;
}

export const THEME_CONFIGS: Record<
  BorderTheme,
  {
    name: string;
    bg: string;
    textPrimary: string;
    textSecondary: string;
    borderLine: string;
  }
> = {
  white: {
    name: "Classic White",
    bg: "#ffffff",
    textPrimary: "#18181b",
    textSecondary: "#71717a",
    borderLine: "#e4e4e7",
  },
  black: {
    name: "Film Noir",
    bg: "#121214",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    borderLine: "#27272a",
  },
  cream: {
    name: "Vintage Cream",
    bg: "#faf6ed",
    textPrimary: "#3e2e20",
    textSecondary: "#857361",
    borderLine: "#e5ded2",
  },
  pink: {
    name: "Blush Pink",
    bg: "#fdf2f8",
    textPrimary: "#831843",
    textSecondary: "#be185d",
    borderLine: "#fbcfe8",
  },
};

export const FILTER_CONFIGS: Record<
  FilterType,
  { name: string; cssFilter: string; previewColor: string }
> = {
  normal: {
    name: "Natural",
    cssFilter: "none",
    previewColor: "bg-emerald-500",
  },
  bw: {
    name: "B & W",
    cssFilter: "grayscale(100%) contrast(115%) brightness(102%)",
    previewColor: "bg-zinc-800",
  },
  vintage: {
    name: "Warm Retro",
    cssFilter: "sepia(35%) contrast(108%) brightness(105%) saturate(120%)",
    previewColor: "bg-amber-600",
  },
  cool: {
    name: "Cool Film",
    cssFilter: "contrast(110%) brightness(104%) hue-rotate(185deg) saturate(95%)",
    previewColor: "bg-sky-500",
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function generatePhotoStrip(
  photos: string[],
  options: StripOptions = { theme: "white", filter: "normal", showDate: true }
): Promise<string> {
  if (typeof window === "undefined" || photos.length === 0) return "";

  const theme = THEME_CONFIGS[options.theme] || THEME_CONFIGS.white;
  const filter = FILTER_CONFIGS[options.filter] || FILTER_CONFIGS.normal;

  // High-resolution canvas dimensions
  const canvasWidth = 840;
  const paddingX = 42;
  const paddingTop = 42;
  const photoGap = 28;
  const photoWidth = canvasWidth - paddingX * 2; // 756px
  const photoHeight = Math.round((photoWidth * 3) / 4); // 567px (4:3 ratio)
  const footerHeight = 180;

  const totalPhotos = photos.length;
  const canvasHeight =
    paddingTop + totalPhotos * photoHeight + (totalPhotos - 1) * photoGap + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");

  // Draw background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Load all images in parallel
  const loadedImages = await Promise.all(photos.map(loadImage));

  // Draw each photo
  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    const yPos = paddingTop + i * (photoHeight + photoGap);

    ctx.save();

    // Rounded rectangle clip for photos
    const cornerRadius = 12;
    ctx.beginPath();
    ctx.moveTo(paddingX + cornerRadius, yPos);
    ctx.lineTo(paddingX + photoWidth - cornerRadius, yPos);
    ctx.quadraticCurveTo(paddingX + photoWidth, yPos, paddingX + photoWidth, yPos + cornerRadius);
    ctx.lineTo(paddingX + photoWidth, yPos + photoHeight - cornerRadius);
    ctx.quadraticCurveTo(
      paddingX + photoWidth,
      yPos + photoHeight,
      paddingX + photoWidth - cornerRadius,
      yPos + photoHeight
    );
    ctx.lineTo(paddingX + cornerRadius, yPos + photoHeight);
    ctx.quadraticCurveTo(paddingX, yPos + photoHeight, paddingX, yPos + photoHeight - cornerRadius);
    ctx.lineTo(paddingX, yPos + cornerRadius);
    ctx.quadraticCurveTo(paddingX, yPos, paddingX + cornerRadius, yPos);
    ctx.closePath();
    ctx.clip();

    // Apply color filter
    if (filter.cssFilter && filter.cssFilter !== "none") {
      ctx.filter = filter.cssFilter;
    }

    // Aspect-fill image into frame
    const imgAspect = img.width / img.height;
    const targetAspect = photoWidth / photoHeight;
    let sWidth = img.width;
    let sHeight = img.height;
    let sx = 0;
    let sy = 0;

    if (imgAspect > targetAspect) {
      sWidth = img.height * targetAspect;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / targetAspect;
      sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, paddingX, yPos, photoWidth, photoHeight);
    ctx.restore();

    // Subtle photo border stroke
    ctx.save();
    ctx.strokeStyle = theme.borderLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(paddingX, yPos, photoWidth, photoHeight, cornerRadius);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Footer Area
  const footerStartY = paddingTop + totalPhotos * photoHeight + (totalPhotos - 1) * photoGap;
  const centerX = canvasWidth / 2;

  // Decorative divider line
  ctx.save();
  ctx.strokeStyle = theme.borderLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, footerStartY + 30);
  ctx.lineTo(centerX + 120, footerStartY + 30);
  ctx.stroke();
  ctx.restore();

  // Decorative stars
  ctx.fillStyle = theme.textSecondary;
  ctx.font = "14px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦  ✦  ✦", centerX, footerStartY + 50);

  // Main Photobooth Title
  ctx.fillStyle = theme.textPrimary;
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const caption = options.customCaption?.trim() || "PHOTO BOOTH";
  ctx.fillText(caption.toUpperCase(), centerX, footerStartY + 85);

  // Date and timestamp
  if (options.showDate !== false) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    ctx.fillStyle = theme.textSecondary;
    ctx.font = "500 15px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${dateStr.toUpperCase()} • ${timeStr}`, centerX, footerStartY + 122);
  }

  return canvas.toDataURL("image/png");
}
