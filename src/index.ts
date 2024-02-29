/* eslint-disable no-restricted-globals */
import { version } from "../package.json";
import { handler } from "./cgi";
import { CacheDB } from "./utils/cache-db";
import * as logger from "./utils/logger";

const sw = self as ServiceWorkerGlobalScope & typeof globalThis;

addEventListener("fetch", (event) => {
	(event as FetchEvent).respondWith(handler((event as FetchEvent).request));
});

addEventListener("install", () => {
	logger.success(`ClientWorker@${version} installed!`);
	sw.skipWaiting();
});

addEventListener("activate", () => {
	logger.success(`ClientWorker@${version} activated!`);
	sw.clients.claim();
});

(async () => {
	const db = await CacheDB.create();
	const responseDb = await CacheDB.create("ClientWorker_ResponseCache");

	logger.success(`ClientWorker${version} started!`);

	// TODO
	// db.read("hotpatch").then((script) => {
	// 	if (script) {
	// 		cons.s("Hotpatch Loaded!");
	// 		eval(script as string);
	// 	} else {
	// 		cons.w("Hotpatch Not Found!");
	// 	}
	// });

	db.read("config").then((config) => {
		const parsedConfig = JSON.parse(config) || {};

		setInterval(
			async () => {
				logger.success(`ClientWorker@${version} start to clean expired cache!`);

				const keys = await responseDb.cache.keys();

				for (const key of keys) {
					responseDb.cache.match(key).then((res) => {
						if (
							Number(res!.headers.get("ClientWorker-ExpireTime")) <=
							performance.now()
						) {
							responseDb.cache.delete(key);
						}
					});
				}
			},
			parseInt(parsedConfig.cleaninterval) || 60 * 1000,
		);
	});
})();
