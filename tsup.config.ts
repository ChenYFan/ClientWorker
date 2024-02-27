import type { Options } from "tsup";
import { defineConfig } from "tsup";

const CONFIG_LOADER_RE = /^virtual:config-loader$/;
const js = String.raw;

const outExtension: Options["outExtension"] = ({ options }) => {
	const formatExtension = options.minify ? ".min" : "";

	return {
		js: `${formatExtension}.js`,
	};
};

export default defineConfig([
	{
		entry: {
			index: "src/index.ts",
		},
		target: "esnext",
		format: "esm",
		dts: true,
		outExtension,
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
						() => ({
							contents: js`
export const loadConfig = JSON.parse;
export const configFile = "/config.json";`,
							loader: "js",
						}),
					);
				},
			},
		],
	},
	{
		entry: {
			"with-yaml": "src/index.ts",
		},
		target: "esnext",
		format: "esm",
		dts: true,
		outExtension,
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
						() => ({
							contents: js`
import { load } from "js-yaml";

export const loadConfig = load;
export const configFile = "/config.yaml";
`,
							resolveDir: "node_modules",
							loader: "js",
						}),
					);
				},
			},
		],
	},
]);
