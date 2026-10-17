// Offline RGB grade for the supplied 1920x1080 composition.
const mark = [[670,275],[954,469],[1240,278],[1256,298],[1256,743],[1119,655],[1120,509],[972,634],[953,622],[784,500],[784,656],[664,741]];
const tools = [
  [[402,192],[558,148],[604,273],[446,320]],
  [[1252,63],[1424,82],[1446,143],[1400,301],[1215,274],[1211,157]],
  [[315,681],[534,678],[555,888],[315,890]],
  [[1546,383],[1615,390],[1687,475],[1650,647],[1485,610]],
  [[1163,771],[1307,745],[1375,793],[1388,894],[1357,939],[1200,978],[1205,933],[1141,935],[1128,809]],
];
const clamp = value => Math.max(0, Math.min(1, value));
function inside(x, y, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i], [bx, by] = polygon[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) result = !result;
  }
  return result;
}
function edgeDistance(x, y, polygon) {
  let squared = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i], [bx, by] = polygon[j];
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
    squared = Math.min(squared, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2);
  }
  return Math.sqrt(squared);
}
export function createLightHeroGrade(width, height) {
  const pixels = width * height;
  const markMask = new Uint8Array(pixels), orbitMask = new Uint8Array(pixels);
  const betweenTools = new Uint8Array(pixels).fill(255);
  const radians = -18 * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const px = (x + .5) * 1920 / width, py = (y + .5) * 1080 / height, index = y * width + x;
    if (px > 650 && px < 1270 && py > 260 && py < 760) markMask[index] = inside(px, py, mark) ? 255 : Math.round(clamp(6.5 - edgeDistance(px, py, mark)) * 255);
    const dx = px - 940, dy = py - 474;
    const u = dx * cos + dy * sin, v = -dx * sin + dy * cos;
    const level = Math.hypot(u / 530, v / 158);
    const gradient = Math.hypot(u / (530 * 530), v / (158 * 158)) / Math.max(level, 1e-9);
    orbitMask[index] = Math.round(clamp(35.5 - Math.abs(level - 1) / Math.max(gradient, 1e-9)) * 255);
  }
  for (const polygon of tools) {
    const xs = polygon.map(point => point[0]), ys = polygon.map(point => point[1]);
    const left = Math.max(0, Math.floor(Math.min(...xs) * width / 1920)), right = Math.min(width, Math.ceil(Math.max(...xs) * width / 1920));
    const top = Math.max(0, Math.floor(Math.min(...ys) * height / 1080)), bottom = Math.min(height, Math.ceil(Math.max(...ys) * height / 1080));
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) if (inside((x + .5) * 1920 / width, (y + .5) * 1080 / height, polygon)) betweenTools[y * width + x] = 0;
  }
  const ramps = [[1,.94,.82,.78,.75,.72,.70,.68,.67,.66,.65],[1,.95,.85,.81,.79,.77,.75,.74,.73,.72,.71],[1,.97,.89,.86,.84,.83,.82,.81,.80,.79,.78]];
  const silver = ramps.map(() => new Float32Array(4096));
  for (let i = 0; i < 4096; i++) {
    const position = Math.min(10, i / 4080 * 10), first = Math.min(9, Math.floor(position)), fraction = position - first;
    for (let channel = 0; channel < 3; channel++) silver[channel][i] = (ramps[channel][first] * (1 - fraction) + ramps[channel][first + 1] * fraction) * 255;
  }
  const connectionAlpha = new Float32Array(511), markAlpha = new Float32Array(511);
  for (let i = 0; i < 511; i++) { connectionAlpha[i] = clamp((i - 255) * 6 / 255 - .9); markAlpha[i] = clamp((i - 255) * 20 / 255 - 1.1); }
  return (source, output) => {
    for (let pixel = 0, byte = 0; pixel < pixels; pixel++, byte += 3) {
      const r = source[byte], g = source[byte + 1], b = source[byte + 2];
      const luma = (54 * r + 183 * g + 19 * b) >> 4;
      let red = silver[0][luma], green = silver[1][luma], blue = silver[2][luma];
      const difference = b - r + 255;
      const cobaltR = .5 * r + 25.5, cobaltG = .65 * g + 61.2, cobaltB = .43 * b + 140.25;
      if (betweenTools[pixel]) {
        if (orbitMask[pixel]) {
          const luminance = luma / 16, alpha = clamp(luma / 4080 * 4 - .24) * orbitMask[pixel] / 255;
          red += (.2 * luminance + 20.4 - red) * alpha; green += (.4 * luminance + 76.5 - green) * alpha; blue += (.25 * luminance + 191.25 - blue) * alpha;
        }
        const alpha = connectionAlpha[difference];
        red += (cobaltR - red) * alpha; green += (cobaltG - green) * alpha; blue += (cobaltB - blue) * alpha;
      }
      if (markMask[pixel]) {
        const alpha = markAlpha[difference] * markMask[pixel] / 255;
        red += (cobaltR - red) * alpha; green += (cobaltG - green) * alpha; blue += (cobaltB - blue) * alpha;
      }
      output[byte] = Math.round(red); output[byte + 1] = Math.round(green); output[byte + 2] = Math.round(blue);
    }
  };
}
