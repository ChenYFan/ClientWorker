export class CacheDB {
	constructor(
		private namespace: string = "CacheDBDefaultNameSpace",
		private prefix: string = "CacheDBDefaultPrefix",
	) {}

	private generateUrl(key: string) {
		return `https://${this.prefix}/${encodeURIComponent(key)}`;
	}

	public async read(
		key: string,
		config: { type: string } = {
			type: "text",
		},
	) {
		const cache = await caches.open(this.namespace);
		const response = await cache.match(new Request(this.generateUrl(key)));

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
		value: any,
		config: { type: string } = { type: "text" },
	) {
		const cache = await caches.open(this.namespace);

		await cache.put(
			new Request(this.generateUrl(key)),
			new Response(value, {
				headers: {
					"Content-Type": inferContentType(config.type),
				},
			}),
		);
	}

	public async delete(key: string): Promise<boolean> {
		const cache = await caches.open(this.namespace);
		const response = await cache.delete(new Request(this.generateUrl(key)));

		return response;
	}
}

function inferContentType(type: string) {
	switch (type) {
		case "json": {
			return "application/json";
		}
		case "arrayBuffer": {
			return "application/octet-stream";
		}
		case "blob": {
			return "application/octet-stream";
		}
		default: {
			return "text/plain";
		}
	}
}
