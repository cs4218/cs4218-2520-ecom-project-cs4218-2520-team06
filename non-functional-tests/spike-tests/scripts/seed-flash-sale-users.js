import "dotenv/config";
import { upsertUsersForLoadTest } from "../../../db-util.js";

const USER_POOL_SIZE = 1500;
const PASSWORD = "password123";
const USER_EMAIL_PREFIX = "flash-sale-user";
const USER_EMAIL_DOMAIN = "test.com";

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
  console.error("Failed to seed flash sale users", error);
  process.exit(1);
});
