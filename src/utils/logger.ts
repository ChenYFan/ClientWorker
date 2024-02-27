/* eslint-disable no-console */

const createLogger =
	(prefix: string, color: string, background: string) => (message: string) => {
		console.log(
			`%c[${prefix}]%c ${message}`,
			`color:${color};background:${background};`,
			"",
		);
	};

export const success = createLogger("SUCCESS", "white", "green");
export const warning = createLogger("WARNING", "brown", "yellow");
export const info = createLogger("INFO", "white", "blue");
export const error = createLogger("ERROR", "white", "red");
export const debug = createLogger("DEBUG", "white", "black");
