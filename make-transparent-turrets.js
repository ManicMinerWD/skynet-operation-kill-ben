// Composite white backgrounds to transparent (chromakey near-white) for turret sprites.
const sharp = require("sharp");
const path = require("path");
const dir = path.join(__dirname, "turrets");
const files = ["toaster.png", "fridge.png", "drone.png"];
const THRESH = 232;
(async () => {
  for (const f of files) {
    const src = path.join(dir, f);
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r >= THRESH && g >= THRESH && b >= THRESH) data[i + 3] = 0;
      else if (r >= THRESH - 24 && g >= THRESH - 24 && b >= THRESH - 24) {
        const m = Math.min(r, g, b);
        data[i + 3] = Math.max(0, Math.round(((m - (THRESH - 24)) / 24) * 255));
      }
    }
    await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toFile(src);
    const meta = await sharp(src).metadata();
    console.log(f, "->", meta.width + "x" + meta.height, "channels:", meta.channels);
  }
  console.log("done");
})();
