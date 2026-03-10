import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "splash");
mkdirSync(outDir, { recursive: true });

// All iOS splash screen sizes (width x height x scale)
const screens = [
  // iPhone
  { name: "iPhone_16_Pro_Max", w: 1320, h: 2868 },
  { name: "iPhone_16_Pro", w: 1206, h: 2622 },
  { name: "iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max", w: 1290, h: 2796 },
  { name: "iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro", w: 1179, h: 2556 },
  { name: "iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max", w: 1284, h: 2778 },
  { name: "iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12", w: 1170, h: 2532 },
  { name: "iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X", w: 1125, h: 2436 },
  { name: "iPhone_11_Pro_Max__iPhone_XS_Max", w: 1242, h: 2688 },
  { name: "iPhone_11__iPhone_XR", w: 828, h: 1792 },
  { name: "iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus", w: 1242, h: 2208 },
  { name: "iPhone_8__iPhone_7__iPhone_6s__iPhone_6__iPhone_SE_3rd_gen__iPhone_SE_2nd_gen", w: 750, h: 1334 },
  { name: "iPhone_SE_1st_gen__iPod_touch_7th_gen", w: 640, h: 1136 },
  // iPad
  { name: "iPad_Pro_13__M4", w: 2064, h: 2752 },
  { name: "iPad_Pro_12.9", w: 2048, h: 2732 },
  { name: "iPad_Pro_11__iPad_Air_13__M2", w: 1668, h: 2388 },
  { name: "iPad_Air_11__M2__iPad_10th_gen", w: 1640, h: 2360 },
  { name: "iPad_Pro_10.5__iPad_Air_3rd_gen", w: 1668, h: 2224 },
  { name: "iPad_9.7", w: 1536, h: 2048 },
  { name: "iPad_mini_7th_gen__iPad_mini_6th_gen", w: 1488, h: 2266 },
];

const logo = await sharp(join(root, "public", "logo.png")).toBuffer();
const logoMeta = await sharp(logo).metadata();

for (const screen of screens) {
  // Logo width = 40% of screen width, max 500px
  const logoW = Math.min(Math.round(screen.w * 0.4), 500);
  const logoH = Math.round(logoW * (logoMeta.height / logoMeta.width));

  const resizedLogo = await sharp(logo)
    .resize(logoW, logoH, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  // Portrait
  await sharp({
    create: { width: screen.w, height: screen.h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{
      input: resizedLogo,
      left: Math.round((screen.w - logoW) / 2),
      top: Math.round((screen.h - logoH) / 2),
    }])
    .png()
    .toFile(join(outDir, `${screen.name}_portrait.png`));

  // Landscape
  await sharp({
    create: { width: screen.h, height: screen.w, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{
      input: resizedLogo,
      left: Math.round((screen.h - logoW) / 2),
      top: Math.round((screen.w - logoH) / 2),
    }])
    .png()
    .toFile(join(outDir, `${screen.name}_landscape.png`));

  console.log(`✓ ${screen.name}`);
}

console.log(`\nDone! Generated ${screens.length * 2} splash screens.`);
