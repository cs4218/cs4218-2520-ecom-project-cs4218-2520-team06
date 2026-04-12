import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { upsertUsersForLoadTest } from "../../../db-util.js";
import {
  USER_POOL_SIZE,
  PASSWORD,
  USER_EMAIL_PREFIX,
  USER_EMAIL_DOMAIN,
} from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  const result = await upsertUsersForLoadTest({
    prefix: USER_EMAIL_PREFIX,
    count: USER_POOL_SIZE,
    plainPassword: PASSWORD,
    domain: USER_EMAIL_DOMAIN,
  });

  console.log(
    `Seeded stress users prefix='${USER_EMAIL_PREFIX}': matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`
  );
}

main().catch((error) => {
  console.error("Failed to seed stress test users", error);
  process.exit(1);
});
