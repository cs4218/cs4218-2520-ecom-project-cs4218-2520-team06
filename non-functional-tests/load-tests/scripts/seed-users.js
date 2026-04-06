import "dotenv/config";
import { upsertUsersForLoadTest } from "../../../db-util.js";
import {
  USER_POOL_SIZE,
  PASSWORD,
  USER_EMAIL_PREFIX,
  USER_EMAIL_DOMAIN,
} from "./constants.js";

async function main() {
  const result = await upsertUsersForLoadTest({
    prefix: USER_EMAIL_PREFIX,
    count: USER_POOL_SIZE,
    plainPassword: PASSWORD,
    domain: USER_EMAIL_DOMAIN,
  });

  console.log(
    `Seeded users with prefix '${USER_EMAIL_PREFIX}': matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`
  );
}

main().catch((error) => {
  console.error("Failed to seed load test users", error);
  process.exit(1);
});
