type ConfigType =
	| "json"
	| "arrayBuffer"
	| "blob"
	| "text"
	| (string & Record<never, never>); // For autocompletion

interface Config {
	type: ConfigType;
}

export class CacheDB {
	private constructor(
		private prefix: string,
		public cache: Cache,
	) {}

	public static async create(
		namespace = "CacheDBDefaultNameSpace",
		prefix = "CacheDBDefaultPrefix",
	): Promise<CacheDB> {
		const cache = await caches.open(namespace);

		return new CacheDB(prefix, cache);
	}

	private generateRequestKey(key: string) {
		return new Request(`https://${this.prefix}/${encodeURIComponent(key)}`);
	}

	public async read(
		key: string,
		config: Config = {
			type: "text",
		},
	): Promise<any> {
		const response = await this.cache.match(this.generateRequestKey(key));

		if (!response) {
			return null;
		}

		switch (config.type) {
			case "json": {
				return response.json();
			}
			case "arrayBuffer": {
				return response.arrayBuffer();
			}
			case "blob": {
				return response.blob();
			}
			default: {
				return response.text();
			}
		}
	}

	public async write(
		key: string,
		value:
			| ReadableStream
			| Blob
			| ArrayBufferView
			| ArrayBuffer
			| FormData
			| URLSearchParams
			| string,
		config: Config = { type: "text" },
	) {
		await this.cache.put(
			this.generateRequestKey(key),
			new Response(value, {
				headers: {
					"Content-Type": inferContentType(config.type),
				},
			}),
		);
	}

	public async delete(key: string): Promise<boolean> {
		const response = await this.cache.delete(this.generateRequestKey(key));

		return response;
	}
}

function inferContentType(type: ConfigType) {
	switch (type) {
		case "json": {
			return "application/json";
		}
		case "arrayBuffer":
		case "blob": {
			return "application/octet-stream";
		}
		default: {
			return "text/plain";
		}
	}
}
