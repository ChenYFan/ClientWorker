import type { Method, Params } from "tiny-request-router";
import { Router } from "tiny-request-router";

import { version } from "../package.json";
import { CacheDB } from "./cache-db";
import { CW_CGI_PREFIX } from "./constants";
import type { ConfigLoader } from "./types";

function createRouter(loadConfig: ConfigLoader) {
	const router = new Router<
		(params: Params, queries: Params) => Promise<Response> | Response
	>();
	const db = new CacheDB();

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
	router.get("/api/config", async (_params, queries) => {
		const source = await fetch(queries.url || "/config.yaml")
			.then((res) => res.text())
			.then((text) => loadConfig(text))
			.then(async (config) => {
				await db.write("config", JSON.stringify(config), { type: "json" });

				return new Response("ok");
			})
			.catch(async (err) => {
				await db.write("config", "");

				return new Response(err);
			});
	});

	return router;
}

export const createRouteHandler = (loadConfig: ConfigLoader) =>
	async function handleRoutes(request: Request): Promise<Response> {
		const router = createRouter(loadConfig);
		const url = new URL(request.url.slice(CW_CGI_PREFIX.length));
		const match = router.match(request.method as Method, url.pathname);

		if (match) {
			const response = await match.handler(
				match.params,
				Object.fromEntries(url.searchParams.entries()),
			);

			return response;
		} else {
			return new Response("Not Found!, Client Worker!");
		}
	};
