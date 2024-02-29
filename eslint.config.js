import { so1ve } from "@so1ve/eslint-config";

export default so1ve({
	yaml: {
		overrides: {
			"yaml/no-empty-key": "off",
			"yaml/no-empty-mapping-value": "off",
		},
	},
});
