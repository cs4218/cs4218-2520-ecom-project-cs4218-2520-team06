import "dotenv/config";
import { deleteUsersAndOrdersByPrefix } from "../../../db-util.js";

const VIRAL_EMAIL_PREFIX = "viral-spike";
const VIRAL_EMAIL_DOMAIN = "test.com";

async function main() {
  const cleanupResult = await deleteUsersAndOrdersByPrefix(
    VIRAL_EMAIL_PREFIX,
    VIRAL_EMAIL_DOMAIN
  );

  console.log(
    `Deleted ${cleanupResult.ordersDeleted} orders and ${cleanupResult.usersDeleted} users with prefix '${VIRAL_EMAIL_PREFIX}' and domain '${VIRAL_EMAIL_DOMAIN}'`
  );
}

main().catch((error) => {
  console.error("Failed to cleanup viral auth users", error);
  process.exit(1);
});
