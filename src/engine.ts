/* eslint-disable ts/no-throw-literal */
import type {
	FetchEngineConfig,
	FetchEngineFunction,
	ListFetchEngineFunction,
} from "./types";
import * as logger from "./utils/logger";
import { rebuildRequest, rebuildResponse } from "./utils/rebuild";

const create504Response = (engine: string) =>
	new Response(
		`504 All gateways failed, ClientWorker shows this page. (Engine ${engine})`,
		{
			status: 504,
			statusText: "504 All Gateways Timeout",
		},
	);

const DEFAULT_CONFIG = Object.freeze({
	threads: 4,
	trylimit: 10,
	status: 200,
	timeout: 5000,
	redirect: "follow",
} satisfies FetchEngineConfig);

export const engineFetch: FetchEngineFunction = async (request, config) => {
	config = {
		status: 200,
		timeout: 5000,
		redirect: "follow",
		...config,
	};

	// setTimeout(() => {
	// 	throw create504Response("Fetch");
	// }, config.timeout);

	return await fetch(request, {
		mode: config.mode,
		credentials: config.credentials,
		redirect: config.redirect,
	});
};

export const engineCrazy: FetchEngineFunction = async (request, config) => {
	config = {
		...DEFAULT_CONFIG,
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
			`Engine Crazy: The Origin does not support Crazy Mode, or the size of the file is less than ${config.threads} bytes, downgrade to normal fetch.`,
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
		throw create504Response("Crazy");
	}, config.timeout);

	return new Response(new Blob(responses), {
		headers: preHeaders,
		status: 200,
		statusText: "OK",
	});
};

export const engineClassic: ListFetchEngineFunction = async (
	requests,
	config,
) => {
	config = {
		...DEFAULT_CONFIG,
		...config,
	};

	if (requests.length === 0) {
		throw new Error("Engine Classic: No request to fetch.");
	} else if (requests.length === 1) {
		logger.warning(
			"Engine Classic: only one request, this request will downgrade to normal fetch.",
		);

		return engineFetch(requests[0], config);
	}

	const controller = new AbortController();

	setTimeout(() => {
		throw create504Response("Classic");
	}, config.timeout);

	const fetchRequests = requests.map(async (req) => {
		try {
			const response = await fetch(req, {
				signal: controller.signal,
				mode: config!.mode,
				credentials: config!.credentials,
				redirect: config!.redirect,
			});

			const responseData = await response.arrayBuffer();

			const modifiedResponse = new Response(responseData, {
				status: response.status,
				headers: response.headers,
				statusText: response.statusText,
			});

			if (modifiedResponse.status === config!.status) {
				controller.abort();

				return modifiedResponse;
			}
		} catch (err) {
			if (err === "DOMException: The user aborted a request.") {
				// eslint-disable-next-line no-console
				console.log(); // To disable the warning:DOMException: The user aborted a request.
			}
		}
	});

	return (await Promise.any(fetchRequests))!;
};

export const engineParallel: ListFetchEngineFunction = async (
	requests,
	config,
) => {
	config = {
		...DEFAULT_CONFIG,
		...config,
	};

	if (requests.length === 0) {
		throw new Error("Engine Parallel: No request to fetch.");
	} else if (requests.length === 1) {
		logger.warning(
			"Engine Parallel: only one request, this request will downgrade to normal fetch.",
		);

		return engineFetch(requests[0], config);
	}

	const abortEvent = new Event("abortOtherInstance");
	const eventTarget = new EventTarget();

	const fetchRequests = requests.map(async (req) => {
		const controller = new AbortController();
		let tagged = false;

		eventTarget.addEventListener(abortEvent.type, () => {
			if (!tagged) {
				controller.abort();
			}
		});

		try {
			const res = await fetch(req, {
				signal: controller.signal,
				mode: config!.mode,
				credentials: config!.credentials,
				redirect: config!.redirect,
			});

			if (config!.status && res.status === config!.status) {
				tagged = true;
				eventTarget.dispatchEvent(abortEvent);

				return rebuildResponse(res);
			}
		} catch (err) {
			if (err === "DOMException: The user aborted a request.") {
				// eslint-disable-next-line no-console
				console.log(); // To disable the warning:DOMException: The user aborted a request.
			}
		}
	});

	setTimeout(() => {
		throw create504Response("Parallel");
	}, config.timeout);

	return (await Promise.any(fetchRequests))!;
};

export const engineKFCThursdayVW50: ListFetchEngineFunction = async (
	requests,
	config,
) => {
	config = {
		...DEFAULT_CONFIG,
		timeout: 30_000,
		...config,
	};

	if (requests.length === 0) {
		throw new Error("Engine KFCThursdayVW50: No request to fetch.");
	} else if (requests.length === 1) {
		logger.warning(
			"Engine KFCThursdayVW50: only one request, this request will downgrade to engine crazy.",
		);

		return engineCrazy(requests[0], config);
	}

	const controller = new AbortController();
	const preFetch = await engineParallel(requests, {
		signal: controller.signal,
		mode: config.mode,
		credentials: config.credentials,
		redirect: config.redirect,
		timeout: config.timeout,
	});
	const preHeaders = preFetch.headers;
	const contentLength = Number.parseInt(preHeaders.get("Content-Length")!);

	if (preFetch.status === config.status) {
		throw create504Response("KFCThursdayVW50");
	}

	controller.abort();

	if (!contentLength || contentLength < config.threads!) {
		logger.warning(
			`Engine KFCThursdayVW50: The Origin does not support KFCThursdayVW50 mode, or the size of the file is less than ${config.threads} bytes, downgrade to parallel.`,
		);

		// FIXME: Used to be `engineFetch`, am I wrong
		return engineParallel(requests, config);
	}

	const chunkSize = contentLength / config.threads!;
	const chunks: Promise<ArrayBuffer>[] = [];

	for (let i = 0; i < config.threads!; i++) {
		chunks.push(
			new Promise((resolve, reject) => {
				let trycount = 1;

				async function instance(): Promise<ArrayBuffer> {
					trycount += 1;

					const newRequests = [];

					for (const request of requests) {
						newRequests.push(
							rebuildRequest(request, {
								headers: {
									Range: `bytes=${i * chunkSize}-${(i + 1) * chunkSize - 1}`,
								},
								url: request.url,
							}),
						);
					}

					return engineParallel(newRequests, {
						mode: config!.mode,
						credentials: config!.credentials,
						redirect: config!.redirect,
						timeout: config!.timeout,
						status: 206,
					})
						.then((response) => response.arrayBuffer())
						.catch(async (err) => {
							logger.error(`Engine KFCThursdayVW50: ${await err.text()}`);
							if (trycount >= config!.trylimit!) {
								reject(err);
							}

							return instance();
						});
				}
				resolve(instance());
			}),
		);
	}

	setTimeout(() => {
		throw create504Response("KFCThursdayVW50");
	}, config.timeout);

	try {
		const responses = await Promise.all(chunks);

		return new Response(new Blob(responses), {
			headers: preHeaders,
			status: 200,
			statusText: "OK",
		});
	} catch {
		throw create504Response("KFCThursdayVW50");
	}
};
