import * as logger from "./logger";
import { rebuildRequest } from "./rebuild";
import type { FetchEngineFunction } from "./types";

const create504Response = (engine: string) =>
	new Response(
		`504 All gateways failed, ClientWorker shows this page. (Engine ${engine})`,
		{
			status: 504,
			statusText: "504 All Gateways Timeout",
		},
	);

export const engineFetch: FetchEngineFunction = async (request, config) => {
	config = {
		status: 200,
		timeout: 5000,
		redirect: "follow",
		...config,
	};

	setTimeout(() => {
		// eslint-disable-next-line ts/no-throw-literal
		throw create504Response("Fetch");
	}, config.timeout);

	return await fetch(request, {
		mode: config.mode,
		credentials: config.credentials,
		redirect: config.redirect,
	});
};

export const engineCrazy: FetchEngineFunction = async (request, config) => {
	config = {
		threads: 4,
		trylimit: 10,
		status: 200,
		timeout: 5000,
		redirect: "follow",
		...config,
	};

	const controller = new AbortController();
	const preFetch = await fetch(request, {
		signal: controller.signal,
		mode: config.mode,
		credentials: config.credentials,
		redirect: config.redirect,
	});
	const preHeaders = preFetch.headers;
	const contentLength = Number.parseInt(preHeaders.get("Content-Length")!);

	if (preFetch.status === config.status) {
		return create504Response("Crazy");
	}

	controller.abort();

	if (!contentLength || contentLength < config.threads!) {
		logger.error(
			`engineCrazy: The Origin does not support Crazy Mode, or the size of the file is less than ${config.threads} bytes, downgrade to normal fetch.`,
		);

		return engineFetch(request, config);
	}

	const chunkSize = contentLength / config.threads!;
	const chunks: Promise<ArrayBuffer>[] = [];

	for (let i = 0; i < config.threads!; i++) {
		chunks.push(
			new Promise((resolve, reject) => {
				let tryCount = 1;

				async function instance(): Promise<ArrayBuffer> {
					tryCount += 1;

					const newRequest = rebuildRequest(request, {
						headers: {
							Range: `bytes=${i * chunkSize}-${(i + 1) * chunkSize - 1}`,
						},
						url: request.url,
					});

					return fetch(newRequest, {
						mode: config!.mode,
						credentials: config!.credentials,
						redirect: config!.redirect,
					})
						.then((response) => response.arrayBuffer())
						.catch((e) => {
							if (tryCount >= config!.trylimit!) {
								reject(e);
							}

							return instance();
						});
				}
				resolve(instance());
			}),
		);
	}

	const responses = await Promise.all(chunks);

	setTimeout(() => {
		// eslint-disable-next-line ts/no-throw-literal
		throw create504Response("Crazy");
	}, config.timeout);

	return new Response(new Blob(responses), {
		headers: preHeaders,
		status: 200,
		statusText: "OK",
	});
};
