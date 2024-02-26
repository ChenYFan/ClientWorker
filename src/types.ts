export type CwRequestInit = RequestInit & {
	url?: string;
	headers?: Record<string, string>;
};
export type CwResponseInit = ResponseInit & {
	url?: string;
	headers?: Record<string, string>;
};

export interface FetchEngineConfig {
	mode?: RequestMode;
	credentials?: RequestCredentials;
	timeout?: number;
	redirect?: RequestRedirect;
	threads?: number;
	trylimit?: number;
	status?: number;
	signal?: AbortSignal;
}

export type FetchEngineFunction = (
	request: Request,
	config?: FetchEngineConfig,
) => Promise<Response>;

export type ListFetchEngineFunction = (
	request: Request[],
	config?: FetchEngineConfig,
) => Promise<Response>;

export type ConfigLoader = (source: string) => any;
