import { build } from "esbuild";
import { cp } from "node:fs/promises";

await build({
  entryPoints: ["web/site.css", "web/gate.css", "web/site.js", "web/gate.js"],
  outdir: "dist/assets",
  bundle: true,
  splitting: true,
  format: "esm",
  loader: { ".woff": "file", ".woff2": "file" },
  minify: true,
  target: "es2022",
  logLevel: "info",
});

await cp("web/art", "dist/assets", { recursive: true });
