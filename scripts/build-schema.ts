import fs from "node:fs/promises";

import type { Config } from "ts-json-schema-generator";
import { createGenerator } from "ts-json-schema-generator";

const config: Config = {
	path: "./src/types/config.ts",
	tsconfig: "./tsconfig.json",
	type: "*",
	additionalProperties: true,
};

const outPath = "./schemas/config.schema.json";

const schema = createGenerator(config).createSchema(config.type);

const schemaString = JSON.stringify(schema, null, "\t");

await fs.writeFile(outPath, schemaString);
