// Composite white background to transparent for the castle sprite.
const sharp = require("sharp");
const path = require("path");
const file = "castle.png";
const src = path.join(__dirname, file);
const THRESH = 232;
(async () => {
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
  console.log(file, "->", meta.width + "x" + meta.height, "channels:", meta.channels);
  const { data: d2, info: i2 } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  let t = 0; for (let i = 3; i < d2.length; i += i2.channels) if (d2[i] < 10) t++;
  console.log("transparent %:", (100 * t / (i2.width * i2.height)).toFixed(1));
})();
