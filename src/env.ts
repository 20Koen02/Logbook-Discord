import "dotenv/config";
import { z } from "zod";
import { logger } from "./logger";

const envVariables = z.object({
  TOKEN: z.string(),
  CLIENT_ID: z.string().regex(/^\d+$/),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

const env = envVariables.parse(process.env);

logger.info(`Loaded ${Object.keys(env).length} environment variable(s)`);

export default env;
