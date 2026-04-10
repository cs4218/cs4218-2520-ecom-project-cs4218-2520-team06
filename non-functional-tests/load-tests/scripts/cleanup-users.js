import "dotenv/config";
import { deleteUsersAndOrdersByPrefix } from "../../../db-util.js";

const USER_EMAIL_PREFIX = "load-test-user";
const USER_EMAIL_DOMAIN = "test.com";

async function main() {
  const cleanupResult = await deleteUsersAndOrdersByPrefix(
    USER_EMAIL_PREFIX,
    USER_EMAIL_DOMAIN
  );

  console.log(
    `Deleted ${cleanupResult.ordersDeleted} orders and ${cleanupResult.usersDeleted} users with prefix '${USER_EMAIL_PREFIX}' and domain '${USER_EMAIL_DOMAIN}'`
  );
}

main().catch((error) => {
  console.error("Failed to cleanup load test users", error);
  process.exit(1);
});
