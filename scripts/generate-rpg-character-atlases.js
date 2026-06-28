import { createCanvas, loadImage } from "canvas";
import { writeFileSync } from "node:fs";

const source = "public/rpg/assets/atlas-BopZdqsP.png";

const variants = {
  shipper: {
    hair: [55, 40, 35],
    outfit: [255, 47, 120],
    darkOutfit: [170, 22, 80],
    hat: [255, 47, 120],
    accent: [0, 188, 212],
    pants: [34, 48, 92]
  },
  student: {
    hair: [45, 36, 45],
    outfit: [139, 195, 74],
    darkOutfit: [80, 130, 45],
    hat: [86, 66, 125],
    accent: [255, 183, 0],
    pants: [38, 50, 56]
  },
  entrepreneur: {
    hair: [95, 82, 72],
    outfit: [42, 52, 83],
    darkOutfit: [32, 39, 64],
    hat: null,
    accent: [255, 193, 7],
    pants: [22, 28, 48]
  },
  seller: {
    hair: [75, 47, 41],
    outfit: [255, 64, 129],
    darkOutfit: [180, 35, 92],
    hat: null,
    accent: [255, 213, 79],
    pants: [109, 76, 65]
  }
};

const frameHeads = [
  { x: 6, y: 6 }, { x: 39, y: 5 }, { x: 72, y: 6 }, { x: 103, y: 4 },
  { x: 139, y: 5 }, { x: 172, y: 5 }, { x: 8, y: 48 }, { x: 39, y: 47 },
  { x: 73, y: 48 }, { x: 106, y: 47 }, { x: 140, y: 47 }, { x: 173, y: 47 }
];

const drawRect = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = `rgb(${color.join(",")})`;
  ctx.fillRect(x, y, w, h);
};

const colorDistance = (pixel, target) => {
  return Math.abs(pixel[0] - target[0]) + Math.abs(pixel[1] - target[1]) + Math.abs(pixel[2] - target[2]);
};

const recolorPixel = (pixel, variant) => {
  const [r, g, b, a] = pixel;
  if (a === 0) return pixel;

  const isBlondeHair = r > 185 && g > 145 && b < 95;
  if (isBlondeHair) return [...variant.hair, a];

  const isBlueDress = b > 80 && r < 120 && g < 135;
  if (isBlueDress) return [...variant.outfit, a];

  const isDarkBlueDress = b > 45 && b < 115 && r < 80 && g < 90;
  if (isDarkBlueDress) return [...variant.darkOutfit, a];

  const isBrownBoot = colorDistance(pixel, [96, 61, 35]) < 70;
  if (isBrownBoot) return [...variant.pants, a];

  return pixel;
};

const addDetails = (ctx, name, variant) => {
  for (const head of frameHeads) {
    if (variant.hat) {
      drawRect(ctx, head.x - 1, head.y - 4, 16, 4, variant.hat);
      drawRect(ctx, head.x + 12, head.y - 2, 5, 2, variant.hat);
    }

    if (name === "student") {
      drawRect(ctx, head.x - 3, head.y - 5, 20, 3, variant.hat);
      drawRect(ctx, head.x + 13, head.y - 2, 2, 7, variant.accent);
    }

    if (name === "entrepreneur") {
      drawRect(ctx, head.x + 7, head.y + 18, 3, 8, variant.accent);
      drawRect(ctx, head.x + 4, head.y + 18, 4, 4, [245, 245, 245]);
      drawRect(ctx, head.x + 10, head.y + 18, 4, 4, [245, 245, 245]);
    }

    if (name === "seller") {
      drawRect(ctx, head.x + 13, head.y + 20, 6, 9, variant.accent);
      drawRect(ctx, head.x + 14, head.y + 18, 4, 2, [88, 55, 24]);
    }

    if (name === "shipper") {
      drawRect(ctx, head.x - 5, head.y + 20, 6, 11, variant.accent);
    }
  }
};

const image = await loadImage(source);

for (const [name, variant] of Object.entries(variants)) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(0, 0, image.width, image.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const next = recolorPixel(data.data.slice(i, i + 4), variant);
    data.data[i] = next[0];
    data.data[i + 1] = next[1];
    data.data[i + 2] = next[2];
    data.data[i + 3] = next[3];
  }
  ctx.putImageData(data, 0, 0);
  addDetails(ctx, name, variant);

  writeFileSync(`public/rpg/assets/atlas-${name}.png`, canvas.toBuffer("image/png"));
}

console.log("Generated RPG character atlases");
