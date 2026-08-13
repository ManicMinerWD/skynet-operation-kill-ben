// Composite white backgrounds to transparent for enemy sprites (chromakey near-white).
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "enemies");
const files = ["roomba.png", "toaster.png", "fridge.png", "drone.png", "printer.png"];
const THRESH = 232; // pixels with all channels >= this become transparent

(async () => {
  for (const f of files) {
    const src = path.join(dir, f);
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info; // channels === 4 now
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r >= THRESH && g >= THRESH && b >= THRESH) {
        data[i + 3] = 0;
      } else if (r >= THRESH - 24 && g >= THRESH - 24 && b >= THRESH - 24) {
        // soft edge: fade near-white to avoid jaggies
        const m = Math.min(r, g, b);
        data[i + 3] = Math.max(0, Math.round(((m - (THRESH - 24)) / 24) * 255));
      }
    }
    const out = src; // overwrite
    await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toFile(out);
    const meta = await sharp(out).metadata();
    console.log(f, "->", meta.width + "x" + meta.height, "channels:", meta.channels);
  }
  console.log("done");
})();
