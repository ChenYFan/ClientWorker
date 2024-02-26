import * as logger from "./logger";
import type { CwRequestInit, CwResponseInit } from "./types";

export function rebuildRequest(request: Request, init: CwRequestInit) {
	request = request.clone();

	if (request.mode === "navigate") {
		logger.warning(
			`You can't rebuild a POST method with body when it is a navigate request.ClientWorker will ignore it's body`,
		);
	}

	let newRequest = new Request(request, {
		headers: rebuildheaders(request, init.headers),
		method: init.method ?? request.method,
		mode:
			request.mode === "navigate" ? "same-origin" : init.mode ?? request.mode,
		credentials: init.credentials ?? request.credentials,
		redirect: init.redirect ?? request.redirect,
	});

	if (init.url) {
		newRequest = new Request(init.url, newRequest);
	}

	return newRequest;
}

export function rebuildResponse(response: Response, init: CwResponseInit = {}) {
	if (response.type === "opaque") {
		logger.error(
			`You can't rebuild a opaque response.ClientWorker will ignore this build`,
		);

		return response;
	}

	const newResponse = new Response(response.body, {
		headers: rebuildheaders(response, init.headers),
		status: init.status ?? response.status,
		statusText: init.statusText ?? response.statusText,
	});

	return newResponse;
}

function rebuildheaders(
	requestOrResponse: Request | Response,
	headers?: Record<string, string>,
) {
	if (!headers) {
		return new Headers(requestOrResponse.headers);
	}

	const newHeaders = new Headers(requestOrResponse.headers);

	for (const key in headers) {
		if (key in headers) {
			newHeaders.set(key, headers[key]);
		} else {
			newHeaders.delete(key);
		}
	}

	return newHeaders;
}
