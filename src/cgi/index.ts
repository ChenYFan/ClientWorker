import { CW_CGI_PREFIX } from "../constants";
import {
	engineClassic,
	engineCrazy,
	engineFetch,
	engineKFCThursdayVW50,
	engineParallel,
} from "../engine";
import type { RuntimeConfig } from "../types/config";
import { CacheDB } from "../utils/cache-db";
import * as logger from "../utils/logger";
import { rebuildRequest, rebuildResponse } from "../utils/rebuild";
import { handleRoutes } from "./routes";

export async function handler(request: Request) {
	const domain = new URL(new Request("").url).host; // Current domain
	const pathname = new URL(request.url).pathname;
	const db = await CacheDB.create();

	// Intercept the request to the CGI
	if (pathname.startsWith(`${CW_CGI_PREFIX}/`)) {
		return handleRoutes(request);
	}

	const config: RuntimeConfig = await db.read("config", { type: "json" });
	if (!config) {
		return fetch(request);
	}

	let tFetched = false;
	let EngineFetch = false;
	let fetchConfig = {};
	const EngineFetchList: Request[] = [];
	let tReq = request;
	let tRes = new Response();
	for (const catch_rule of config.catch_rules) {
		if (catch_rule.rule === "_") {
			catch_rule.rule = domain;
		}
		// TODO
		if (!new RegExp(catch_rule.rule).test(tReq.url)) {
			continue;
		}

		for (const transformRule of catch_rule.transform_rules) {
			let tSearched = false;

			if (transformRule.search === "_") {
				transformRule.search = catch_rule.rule;
			}
			switch (transformRule.searchin || "url") {
				case "url": {
					if (
						new RegExp(transformRule.search, transformRule.searchflags).test(
							tReq.url,
						)
					) {
						tSearched = true;
					}
					break;
				}
				case "header": {
					if (
						new RegExp(transformRule.search, transformRule.searchflags).test(
							tReq.headers.get(transformRule.searchkey)!,
						)
					) {
						tSearched = true;
					}
					break;
				}
				case "status": {
					if (!tFetched) {
						logger.warning(
							`${tReq.url} is not fetched yet,the status rule are ignored`,
						);
						break;
					}
					if (
						new RegExp(transformRule.search, transformRule.searchflags).test(
							String(tRes.status),
						)
					) {
						tSearched = true;
					}
					break;
				}
				case "statusText": {
					if (!tFetched) {
						logger.warning(
							`${tReq.url} is not fetched yet,the statusText rule are ignored`,
						);
						break;
					}
					if (
						new RegExp(transformRule.search, transformRule.searchflags).test(
							tRes.statusText,
						)
					) {
						tSearched = true;
					}
					break;
				}
				case "body": {
					if (!tFetched) {
						logger.warning(
							`${tReq.url} is not fetched yet,the body rule are ignored`,
						);
						break;
					}
					if (
						new RegExp(transformRule.search, transformRule.searchflags).test(
							await tRes.clone().text(),
						)
					) {
						tSearched = true;
					}
					break;
				}
				default: {
					logger.error(
						`${tReq.url} the ${transformRule.searchin} search rule are not supported`,
					);
					break;
				}
			}

			switch (transformRule.replacein || "url") {
				case "url": {
					if (tFetched && tSearched) {
						logger.warning(
							`${tReq.url} is already fetched,the url transform rule:${transformRule.search} are ignored`,
						);
						break;
					}
					if (typeof transformRule.replace !== "undefined" && tSearched) {
						if (typeof transformRule.replace === "string") {
							if (EngineFetch) {
								logger.warning(
									`EngineFetch Disabled for ${tReq.url},the request will downgrade to normal fetch`,
								);
							}
							tReq = rebuildRequest(tReq, {
								url: tReq.url.replace(
									new RegExp(
										transformRule.replacekey || transformRule.search,
										transformRule.replaceflags,
									),
									transformRule.replace,
								),
							});
							EngineFetch = false;
						} else {
							if (EngineFetch) {
								logger.warning(
									`Replacement cannot be used for ${tReq.url},the request is already powered by fetch-engine `,
								);
								break;
							}
							for (const replacement of transformRule.replace) {
								if (replacement === "_") {
									EngineFetchList.push(tReq);
									continue;
								}
								EngineFetchList.push(
									rebuildRequest(tReq, {
										url: tReq.url.replace(
											new RegExp(
												transformRule.replacekey || transformRule.search,
												transformRule.replaceflags,
											),
											replacement,
										),
									}),
								);
							}

							EngineFetch = true;
						}
					}
					break;
				}
				case "body": {
					if (tSearched) {
						if (tFetched) {
							tRes = rebuildResponse(tRes, {
								body: (await tRes.clone().text()).replace(
									new RegExp(
										transformRule.replacekey || transformRule.search,
										transformRule.replaceflags,
									),
									transformRule.replace,
								),
							});
						} else {
							tReq = rebuildRequest(tReq, {
								body: (await tReq.clone().text()).replace(
									new RegExp(
										transformRule.replacekey || transformRule.search,
										transformRule.replaceflags,
									),
									transformRule.replace,
								),
							});
						}
					}
					break;
				}

				case "status": {
					if (typeof transformRule.replace === "string" && tSearched) {
						tRes = rebuildResponse(tRes, {
							status: tRes.status.replace(
								new RegExp(
									transformRule.replacekey || transformRule.search,
									transformRule.replaceflags,
								),
								transformRule.replace,
							),
						});
					}
					break;
				}
				case "statusText": {
					if (typeof transformRule.replace === "string" && tSearched) {
						tRes = rebuildResponse(tRes, {
							statusText: tRes.statusText.replace(
								new RegExp(
									transformRule.replacekey || transformRule.search,
									transformRule.replaceflags,
								),
								transformRule.replace,
							),
						});
					}
					break;
				}
				default: {
					logger.error(
						`${tReq.url} the ${transformRule.replacein} replace rule are not supported`,
					);
				}
			}
			if (!tSearched) {
				continue;
			}
			if (typeof transformRule.header === "object") {
				for (const header in transformRule.header) {
					if (tFetched) {
						tRes = rebuildResponse(tRes, {
							headers: { [header]: transformRule.header[header] },
						});
					} else {
						tReq = rebuildRequest(tReq, {
							headers: { [header]: transformRule.header[header] },
						});
					}
				}
			}

			if (typeof transformRule.action !== "undefined") {
				switch (transformRule.action) {
					case "skip": {
						return fetch(request);
					}
					case "fetch": {
						if (tFetched) {
							logger.warning(
								`${tReq.url} is already fetched,the fetch action are ignored`,
							);
							break;
						}
						if (typeof transformRule.fetch === "undefined") {
							logger.error(`Fetch Config is not defined for ${tReq.url}`);
							break;
						}

						fetchConfig = {
							status: transformRule.fetch.status,
							mode: transformRule.fetch.mode,
							credentials: transformRule.fetch.credentials,
							redirect: transformRule.fetch.redirect,
							timeout: transformRule.fetch.timeout,
							threads: transformRule.fetch.threads,
							limit: transformRule.fetch.limit,
						};
						if (!transformRule.fetch.preflight) {
							tReq = new Request(tReq.url, {
								method: ((method) => {
									if (
										method === "GET" ||
										method === "HEAD" ||
										method === "POST"
									) {
										return method;
									}

									return "GET";
								})(tReq.method),
								body: ((body) => {
									if (tReq.method === "POST") {
										return body;
									}

									return null;
								})(tReq.body),
							}); // https://segmentfault.com/a/1190000006095018
							delete fetchConfig.credentials;
							// fetchConfig.mode = "cors"
							for (const eReq in EngineFetchList) {
								EngineFetchList[eReq] = new Request(
									EngineFetchList[eReq].url,
									tReq,
								);
							}
						}

						tRes = await new Promise(async (res, rej) => {
							async function EngineFetcher() {
								let cRes;

								return new Promise(async (resolve, reject) => {
									if (EngineFetch) {
										switch (transformRule.fetch.engine || "parallel") {
											case "classic": {
												cRes = await engineClassic(
													EngineFetchList,
													fetchConfig,
												);
												break;
											}
											case "parallel": {
												cRes = await engineParallel(
													EngineFetchList,
													fetchConfig,
												);
												break;
											}
											case "KFCThursdayVW50": {
												if (new Date().getDay() === 4) {
													logger.error(
														"VW50! The Best Fetch Engine in the World Said!",
													);
												}
												cRes = await engineKFCThursdayVW50(
													EngineFetchList,
													fetchConfig,
												);
												break;
											}
											default: {
												logger.error(
													`Fetch Engine ${transformRule.fetch.engine} is not supported`,
												);
												break;
											}
										}
									} else {
										switch (transformRule.fetch.engine || "fetch") {
											case "fetch": {
												cRes = await engineFetch(tReq, fetchConfig);
												break;
											}
											case "crazy": {
												cRes = await engineCrazy(tReq, fetchConfig);
												break;
											}
											default: {
												logger.error(
													`${tReq.url} the ${transformRule.fetch.engine} engine are not supported`,
												);
												break;
											}
										}
									}
									if (
										typeof transformRule.fetch.cache === "object" &&
										cRes.status === (transformRule.fetch.status || 200)
									) {
										cRes = rebuildResponse(cRes, {
											headers: {
												ClientWorker_ExpireTime:
													Date.now() +
													Number(
														(0, eval)(transformRule.fetch.cache.expire || "0"),
													),
											},
										});
										caches.open("ClientWorker_ResponseCache").then((cache) => {
											cache.put(tReq, cRes.clone()).then(() => {
												resolve(cRes);
											});
										});
									} else {
										resolve(cRes);
									}
								});
							}
							if (typeof transformRule.fetch.cache === "object") {
								caches.open("ClientWorker_ResponseCache").then((cache) => {
									cache.match(tReq).then((cRes) => {
										if (cRes) {
											if (
												Number(cRes.headers.get("ClientWorker_ExpireTime")) >
												Date.now()
											) {
												logger.success(`${tReq.url} is fetched from cache`);
												res(cRes);
											} else {
												logger.warning(`${tReq.url} is expired.`);
												res(
													Promise.any([
														EngineFetcher(),
														new Promise(async (resolve, reject) => {
															setTimeout(() => {
																logger.error(
																	`${tReq.url} is too late to fetch,even though the cache has expired,so return by cache`,
																);
																resolve(cRes);
															}, transformRule.fetch.cache.delay || 3000);
														}),
													]),
												);
											}
										} else {
											logger.warning(
												`${tReq.url} is not cached!And it is too late to fetch!`,
											);
											res(EngineFetcher());
										}
									});
								});
							} else {
								res(EngineFetcher());
							}
						});
						tFetched = true;
						break;
					}
					case "redirect": {
						if (typeof transformRule.redirect === "undefined") {
							logger.error(`Redirect Config is not defined for ${tReq.url}`);
							break;
						}
						if (typeof transformRule.redirect.url === "string") {
							return Response.redirect(
								transformRule.redirect.url,
								transformRule.redirect.status || 301,
							);
						}

						return Response.redirect(
							tReq.url.replace(
								new RegExp(transformRule.search),
								transformRule.redirect.to,
							),
							transformRule.redirect.status || 301,
						);
					}
					case "return": {
						if (typeof transformRule.return === "undefined") {
							transformRule.return = {};
						}

						return new Response(transformRule.return.body || "Error!", {
							status: transformRule.return.status || 503,
							headers: transformRule.return.headers || {},
						});
					}
					case "script": {
						if (typeof transformRule.script === "undefined") {
							logger.error(`Script Config is not defined for ${tReq.url}`);
							break;
						}
						if (typeof transformRule.script.function === "string") {
							const ClientWorkerAnonymousFunctionName = `ClientWorker_AnonymousFunction_${Date.now()}`;
							// eslint-disable-next-line no-eval
							self[ClientWorkerAnonymousFunctionName] = (0, eval)(
								transformRule.script.function,
							);
							transformRule.script.name = ClientWorkerAnonymousFunctionName;
						}
						const ScriptAns = await new Function(
							`return (${transformRule.script.name})`,
						)()({
							fetched: tFetched,
							request: tReq,
							response: tRes,
						});

						if (ScriptAns.fetched) {
							if (transformRule.script.skip || false) {
								return ScriptAns.response;
							}
							tFetched = true;
							tRes = ScriptAns.response;
						} else {
							tReq = ScriptAns.request;
						}
						break;
					}
					default: {
						logger.warning(
							`This Action:${transformRule.action} is not supported yet`,
						);
						break;
					}
				}
			}
		}
	}
	if (!tFetched) {
		// 3.0.0 默认改为skip
		return fetch(request);
	}

	return tRes;
}
