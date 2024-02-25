const { so1ve } = require("@so1ve/eslint-config");

module.exports = so1ve({
	yaml: {
		overrides: {
			"yaml/no-empty-key": "off",
			"yaml/no-empty-mapping-value": "off",
		},
	},
});
