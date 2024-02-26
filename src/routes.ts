import type { Method, Params } from "tiny-request-router";
import { Router } from "tiny-request-router";

import { CacheDB } from "./cache-db";
import { CW_CGI_PREFIX } from "./constants";

const router = new Router<(params: Params) => Promise<Response>>();

export async function handleRoutes(request: Request): Promise<Response> {
	const db = new CacheDB();
	const url = new URL(request.url.slice(CW_CGI_PREFIX.length));
	const match = router.match(request.method as Method, url.pathname);

	if (match) {
		const response = await match.handler(Object.fromEntries(url.searchParams));

		return response;
	} else {
		return new Response("Not Found!, Client Worker!");
	}
}
