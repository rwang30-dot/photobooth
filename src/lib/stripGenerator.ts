export type BorderTheme = "film" | "white" | "black" | "cream" | "pink";
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
  film: {
    name: "35mm Film",
    bg: "#221d1b",
    textPrimary: "#e59a35",
    textSecondary: "#c9822b",
    borderLine: "#332b27",
  },
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

// Draw a rounded rectangle helper with fallback
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Render the 35mm Film Strip matching the reference image:
 * - 35mm film roll borders with left & right sprocket holes
 * - Amber/orange edge numbers and codes ("4", "3", "3A ▶", etc.)
 * - 4 photo frame windows
 */
async function generate35mmFilmStrip(
  loadedImages: HTMLImageElement[],
  filterCss: string
): Promise<string> {
  const canvasWidth = 720;
  const sprocketTrackWidth = 84;
  const photoWidth = canvasWidth - sprocketTrackWidth * 2; // 552px
  const photoHeight = Math.round((photoWidth * 3) / 4); // 414px (4:3 ratio)
  const frameGap = 16;
  const topMargin = 26;
  const bottomMargin = 26;
  const totalPhotos = loadedImages.length;

  const canvasHeight =
    topMargin + totalPhotos * photoHeight + (totalPhotos - 1) * frameGap + bottomMargin;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");

  // 1. Film stock background: warm deep charcoal-black
  ctx.fillStyle = "#221d1b";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Draw 35mm Sprocket Holes (perforations) along left and right tracks
  const sprocketWidth = 34;
  const sprocketHeight = 50;
  const sprocketRadius = 8;
  const sprocketLeftX = (sprocketTrackWidth - sprocketWidth) / 2; // ~25px
  const sprocketRightX = canvasWidth - sprocketTrackWidth + sprocketLeftX;

  const sprocketPitch = 88; // Distance between hole centers
  const numSprockets = Math.floor((canvasHeight - 20) / sprocketPitch);
  const startSprocketY =
    (canvasHeight - (numSprockets - 1) * sprocketPitch - sprocketHeight) / 2;

  ctx.fillStyle = "#ffffff"; // Crisp white sprocket holes matching reference

  for (let s = 0; s < numSprockets; s++) {
    const sy = startSprocketY + s * sprocketPitch;

    // Left hole
    drawRoundedRect(ctx, sprocketLeftX, sy, sprocketWidth, sprocketHeight, sprocketRadius);
    ctx.fill();

    // Right hole
    drawRoundedRect(ctx, sprocketRightX, sy, sprocketWidth, sprocketHeight, sprocketRadius);
    ctx.fill();
  }

  // 3. Draw Vintage Amber / Orange Edge Markings (Kodak 35mm style)
  const amberColor = "#e59a35";
  ctx.fillStyle = amberColor;
  ctx.font = "bold 13px 'SF Mono', Monaco, Menlo, Consolas, monospace";
  ctx.textBaseline = "middle";

  // Frame numbering on film margins
  for (let i = 0; i < totalPhotos; i++) {
    const frameNumber = totalPhotos - i; // 4, 3, 2, 1
    const frameCenterY = topMargin + i * (photoHeight + frameGap) + photoHeight / 2;

    // Left side: frame number
    ctx.textAlign = "center";
    ctx.fillText(`${frameNumber}`, sprocketLeftX + sprocketWidth / 2, frameCenterY - 44);

    // Right side: frame number and arrow (e.g. 3A ▶) matching the reference
    ctx.textAlign = "center";
    ctx.fillText(`${frameNumber}`, sprocketRightX + sprocketWidth / 2, frameCenterY - 44);

    ctx.save();
    ctx.font = "bold 11px 'SF Mono', Monaco, monospace";
    ctx.fillText(`▶ ${frameNumber}A`, sprocketRightX + sprocketWidth / 2, frameCenterY + 44);
    ctx.restore();
  }

  // Film brand label on edge
  ctx.save();
  ctx.fillStyle = amberColor;
  ctx.font = "bold 10px 'SF Mono', Monaco, monospace";
  ctx.letterSpacing = "2px";
  ctx.textAlign = "center";
  ctx.translate(sprocketLeftX + sprocketWidth / 2, canvasHeight - 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("PHOTO BOOTH 400", 0, 0);
  ctx.restore();

  // 4. Draw the 4 Photos
  for (let i = 0; i < totalPhotos; i++) {
    const img = loadedImages[i];
    const yPos = topMargin + i * (photoHeight + frameGap);
    const xPos = sprocketTrackWidth;

    ctx.save();

    // Photo window clipping
    ctx.beginPath();
    ctx.rect(xPos, yPos, photoWidth, photoHeight);
    ctx.clip();

    // Apply photo filter if set
    if (filterCss && filterCss !== "none") {
      ctx.filter = filterCss;
    }

    // Aspect fill image
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

    ctx.drawImage(img, sx, sy, sWidth, sHeight, xPos, yPos, photoWidth, photoHeight);
    ctx.restore();

    // Thin film rebate frame line
    ctx.save();
    ctx.strokeStyle = "#161311";
    ctx.lineWidth = 1;
    ctx.strokeRect(xPos, yPos, photoWidth, photoHeight);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

/**
 * Standard Classic Photo Booth Strip (White, Black, Cream, Pink)
 */
async function generateClassicPhotoStrip(
  loadedImages: HTMLImageElement[],
  theme: (typeof THEME_CONFIGS)[BorderTheme],
  filterCss: string,
  options: StripOptions
): Promise<string> {
  const canvasWidth = 840;
  const paddingX = 42;
  const paddingTop = 42;
  const photoGap = 28;
  const photoWidth = canvasWidth - paddingX * 2; // 756px
  const photoHeight = Math.round((photoWidth * 3) / 4); // 567px (4:3 ratio)
  const footerHeight = 180;
  const totalPhotos = loadedImages.length;

  const canvasHeight =
    paddingTop + totalPhotos * photoHeight + (totalPhotos - 1) * photoGap + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Photos
  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    const yPos = paddingTop + i * (photoHeight + photoGap);
    const cornerRadius = 12;

    ctx.save();
    drawRoundedRect(ctx, paddingX, yPos, photoWidth, photoHeight, cornerRadius);
    ctx.clip();

    if (filterCss && filterCss !== "none") {
      ctx.filter = filterCss;
    }

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

    // Subtle border stroke
    ctx.save();
    ctx.strokeStyle = theme.borderLine;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, paddingX, yPos, photoWidth, photoHeight, cornerRadius);
    ctx.stroke();
    ctx.restore();
  }

  // Footer Area
  const footerStartY = paddingTop + totalPhotos * photoHeight + (totalPhotos - 1) * photoGap;
  const centerX = canvasWidth / 2;

  ctx.save();
  ctx.strokeStyle = theme.borderLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, footerStartY + 30);
  ctx.lineTo(centerX + 120, footerStartY + 30);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = theme.textSecondary;
  ctx.font = "14px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦  ✦  ✦", centerX, footerStartY + 50);

  ctx.fillStyle = theme.textPrimary;
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const caption = options.customCaption?.trim() || "PHOTO BOOTH";
  ctx.fillText(caption.toUpperCase(), centerX, footerStartY + 85);

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

export async function generatePhotoStrip(
  photos: string[],
  options: StripOptions = { theme: "film", filter: "normal", showDate: true }
): Promise<string> {
  if (typeof window === "undefined" || photos.length === 0) return "";

  const themeConfig = THEME_CONFIGS[options.theme] || THEME_CONFIGS.film;
  const filterConfig = FILTER_CONFIGS[options.filter] || FILTER_CONFIGS.normal;

  const loadedImages = await Promise.all(photos.map(loadImage));

  if (options.theme === "film") {
    return generate35mmFilmStrip(loadedImages, filterConfig.cssFilter);
  }

  return generateClassicPhotoStrip(loadedImages, themeConfig, filterConfig.cssFilter, options);
}
