import { build } from "esbuild";
import copyStaticFiles from "esbuild-copy-static-files";
import { writeFile } from "fs/promises";
import { configSchema } from "./types/configType";

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
  await writeFile(
    "dist/config.schema.json",
    JSON.stringify(configSchema, null, 2)
  );
})();

export {};
