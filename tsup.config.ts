import { readFile } from "node:fs/promises";

import type { Options } from "tsup";
import { defineConfig } from "tsup";

const CONFIG_LOADER_RE = /^virtual:config-loader$/;

const buildEntry = (name: string, loaderFilePath: string): Options => ({
	entry: {
		[name]: "src/index.ts",
	},
	target: "esnext",
	format: "esm",
	dts: true,
	outExtension: ({ options }) => {
		const formatExtension = options.minify ? ".min" : "";

		return {
			js: `${formatExtension}.js`,
		};
	},
	esbuildPlugins: [
		{
			name: "replace-config-loader",
			setup(build) {
				build.onResolve({ filter: CONFIG_LOADER_RE }, (args) => ({
					path: args.path,
					namespace: "config-loader",
				}));

				build.onLoad(
					{ filter: CONFIG_LOADER_RE, namespace: "config-loader" },
					async () => {
						const contents = await readFile(loaderFilePath);

						return {
							contents,
							loader: "js",
							resolveDir: "node_modules",
						};
					},
				);
			},
		},
	],
});

export default defineConfig([
	buildEntry("index", "./src/loaders/json.ts"),
	buildEntry("with-yaml", "./src/loaders/yaml.ts"),
]);
