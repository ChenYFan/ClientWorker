import { so1ve } from "@so1ve/eslint-config";

export default so1ve({
	ignores: ["docs/public/cw.js"],
	yaml: {
		overrides: {
			"yaml/no-empty-key": "off",
			"yaml/no-empty-mapping-value": "off",
		},
	},
});
