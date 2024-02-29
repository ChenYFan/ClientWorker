export interface TransformRuleFetch {
	redirect?: RequestRedirect;
	status?: number;
	credentials?: RequestCredentials;
	trylimit?: number;
	mode?: RequestMode;
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
}

export interface TransformRuleHeader {
	"ServerProvide": string;
	"content-type": string;
}

export interface RuntimeConfig {
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
				headers: {
					"ServerProvide": string;
					"content-type": string;
				};
				status: number;
			};
			fetch?: TransformRuleFetch;
			script?: {
				function?: string;
				name?: string;
				skip: boolean;
			};
			header?: TransformRuleHeader;
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
}
