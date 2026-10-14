// Builds dist/index.html — one self-contained file (CSS, JS, data and
// certificate templates all inlined). Upload just that file anywhere.
// Usage: node scripts/bundle.js   (runs build-data first)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
require("./build-data.js");

const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
let html = read("index.html");

// Inline stylesheet
html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/, () => `<style>\n${read("css/style.css")}\n</style>`);

// Inline scripts; swap template paths in config for data URIs
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) => {
  let js = read(src);
  if (src === "js/config.js") {
    js = js.replace(/file:\s*"([^"]+)"/g, (m, file) => {
      const b64 = fs.readFileSync(path.join(root, file)).toString("base64");
      return `file: "data:image/jpeg;base64,${b64}"`;
    });
  }
  return `<script>\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>`;
});

// Inline the logo and gallery photos (any "assets/....png|jpg" attribute in the page)
const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
html = html.replace(/"(assets\/[^"]+\.(png|jpe?g))"/g, (m, file) => {
  const data = fs.readFileSync(path.join(root, file)).toString("base64");
  return `"data:${mime[path.extname(file).toLowerCase()]};base64,${data}"`;
});

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", "index.html");
fs.writeFileSync(out, html);
console.log(`dist/index.html written (${(fs.statSync(out).size / 1048576).toFixed(2)} MB)`);
