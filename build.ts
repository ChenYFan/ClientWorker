import { build } from "esbuild";
import copyStaticFiles from "esbuild-copy-static-files";

(async () => {
  await build({
    entryPoints: ["./main/entry.js"],
    entryNames: "[dir]/cw",
    bundle: true,
    outdir: "dist",
    minify: true,
    sourcemap: true,
    target: ["es2015"],
    plugins: [copyStaticFiles({ src: "static", dest: "dist" })],
  });
})();

export {};
