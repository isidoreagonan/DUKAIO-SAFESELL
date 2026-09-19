import fs from "fs";
import path from "path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const sourcePath = path.resolve("public/new-favicon-source.png");
const publicDir = path.resolve("public");

async function generate() {
  console.log("Reading source image:", sourcePath);
  const buffer = fs.readFileSync(sourcePath);

  // 1. High-res base replacements
  fs.copyFileSync(sourcePath, path.join(publicDir, "dukaio-mark.png"));
  fs.copyFileSync(sourcePath, path.join(publicDir, "dukaio-icon.png"));
  console.log("Copied high-res dukaio-mark.png & dukaio-icon.png");

  // 2. Generate PNG sizes
  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "favicon-48x48.png", size: 48 },
    { name: "favicon-96x96.png", size: 96 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192x192.png", size: 192 },
    { name: "android-chrome-512x512.png", size: 512 },
  ];

  for (const item of sizes) {
    const dest = path.join(publicDir, item.name);
    await sharp(buffer)
      .resize(item.size, item.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(dest);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Generate main favicon.png (48x48 for crisp display & Google requirements)
  const faviconPngPath = path.join(publicDir, "favicon.png");
  await sharp(buffer)
    .resize(48, 48, { fit: "contain" })
    .png()
    .toFile(faviconPngPath);
  console.log("Generated favicon.png (48x48)");

  // 3. Generate multi-size favicon.ico (16, 32, 48)
  const ico16 = await sharp(buffer).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(buffer).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(buffer).resize(48, 48).png().toBuffer();

  const icoBuffer = await pngToIco([ico16, ico32, ico48]);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
  console.log("Generated favicon.ico (containing 16x16, 32x32, 48x48)");

  // 4. Generate / update site.webmanifest
  const manifest = {
    name: "DUKAIO — Plateforme E-commerce & COD",
    short_name: "DUKAIO",
    description: "Créez votre boutique en ligne et encaissez à la livraison.",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ],
    theme_color: "#ea580c",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/"
  };
  fs.writeFileSync(path.join(publicDir, "site.webmanifest"), JSON.stringify(manifest, null, 2));
  console.log("Generated site.webmanifest");

  console.log("All favicon assets generated successfully!");
}

generate().catch((err) => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
