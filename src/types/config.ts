export type RuntimeConfig = {
	hotpatch?: string[];
	hotconfig?: string[];
	cleaninterval?: string;
	catch_rules: {
		rule: string;
		transform_rules: {
			redirect?: {
				status?: number;
				to?: string;
				url?: string;
			};
			return?: {
				body: string;
				header: {
					ServerProvide: string;
					"content-type": string;
				};
				status: number;
			};
			fetch?: {
				redirect?: "error" | "follow" | "manual";
				status?: number;
				credentials?: "same-origin" | "include" | "omit";
				trylimit?: number;
				mode?: "same-origin" | "cors" | "navigate" | "no-cors";
				timeout?: number;
				cache?: {
					enable?: boolean;
					delay?: number;
					expire: string;
				};
				threads?: number;
				enable?: boolean;
				engine: "fetch" | "crazy" | "classic" | "parallel" | "KFCThursdayVW50";
				preflight: boolean;
			};
			script?: {
				function?: string;
				name?: string;
				skip: boolean;
			};
			header?: {
				ServerProvide: string;
				"content-type": string;
			};
			searchin?: string;
			replace?: string | string[];
			action?: "fetch" | "redirect" | "return" | "script" | "skip";
			searchkey?: string;
			replacein?: string;
			replacekey?: string;
			searchflags?: string;
			replaceflags?: string;
			search: string;
		}[];
	}[];
	name: string;
};
