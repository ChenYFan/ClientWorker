import type { Method, Params } from "tiny-request-router";
import { Router } from "tiny-request-router";
import { configFile, loadConfig } from "virtual:config-loader";

import { version } from "../package.json";
import { CW_CGI_PREFIX } from "./constants";
import { CacheDB } from "./utils/cache-db";

async function createRouter() {
	const router = new Router<
		(ctx: { params: Params; queries: Params }) => Promise<Response> | Response
	>();
	const db = await CacheDB.create();
	const responseDb = await CacheDB.create("ClientWorker_ResponseCache");

	router.get("/hello", () => new Response("Hello ClientWorker!"));
	router.get(
		"/info",
		() =>
			new Response(
				JSON.stringify({
					version,
				}),
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			),
	);
	router.get("/page/:name", () => new Response("Error, page type not found"));
	router.get("/page/install", () => fetch("/404"));
	router.get("/api/config", async ({ queries }) => {
		const response = await fetch(queries.url || configFile);
		const text = await response.text();
		try {
			const config = await loadConfig(text);

			await db.write("config", JSON.stringify(config), {
				type: "json",
			});

			return new Response("ok");
		} catch (e: any) {
			await db.write("config", "");

			return new Response(e);
		}
	});
	router.post("/api/clear", async () => {
		const keys = await responseDb.cache.keys();

		await Promise.all(
			keys.map(async (key) => {
				responseDb.cache.delete(key);
			}),
		);

		return new Response("ok");
	});

	// TODO: Hotpatch, Hotconfig

	return router;
}

export async function handleRoutes(request: Request): Promise<Response> {
	const router = await createRouter();
	const url = new URL(request.url.slice(CW_CGI_PREFIX.length));
	const match = router.match(request.method as Method, url.pathname);

	if (match) {
		const response = await match.handler({
			params: match.params,
			queries: Object.fromEntries(url.searchParams.entries()),
		});

		return response;
	} else {
		return new Response("Not Found! (Client Worker)");
	}
}
