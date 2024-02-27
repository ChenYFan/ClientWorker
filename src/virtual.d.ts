declare module "virtual:config-loader" {
	export const configFile: string;
	export const loadConfig: import("./types").ConfigLoader;
}
