// tools/generate_legacy_redirects.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const legacyMapPath = path.join(rootDir, 'curriculum', 'legacy-map.json');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(legacyMapPath)) {
  console.error(`Lỗi: Không tìm thấy ${legacyMapPath}`);
  process.exit(1);
}

const legacyMap = JSON.parse(fs.readFileSync(legacyMapPath, 'utf-8'));
let count = 0;

for (const [legacyUrl, target] of Object.entries(legacyMap)) {
  // legacyUrl looks like "examples/hw0_tensor_memory/bai_01_robot_vision.html"
  // target looks like "lessons/robot_vision/"
  const destHtmlPath = path.join(publicDir, legacyUrl);
  fs.mkdirSync(path.dirname(destHtmlPath), { recursive: true });

  const targetRel = '/' + target.replace(/^\//, '');
  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${targetRel}">
  <title>Đang chuyển hướng sang ${target}...</title>
  <script>
    window.location.replace('${targetRel}' + window.location.search + window.location.hash);
  </script>
</head>
<body style="background:#0f172a; color:#94a3b8; font-family:sans-serif; text-align:center; padding:50px;">
  <p>Đang chuyển hướng đến bài học mới...</p>
  <p><a href="${targetRel}" style="color:#38bdf8;">Bấm vào đây nếu trình duyệt không tự chuyển hướng</a></p>
</body>
</html>
`;

  fs.writeFileSync(destHtmlPath, htmlContent, 'utf-8');
  count++;
}

console.log(`✓ Đã sinh ${count} static redirect HTML stubs trong public/examples/`);
