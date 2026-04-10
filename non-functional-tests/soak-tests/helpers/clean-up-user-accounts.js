import "dotenv/config";
import { deleteUsersAndOrdersByPrefix } from "../../../db-util.js";
import { SEEDED_USER } from "../config/constants.js";

async function removeUserOrdersAndAccounts() {
  const cleanupResult = await deleteUsersAndOrdersByPrefix(
    SEEDED_USER.EMAIL_PREFIX,
    SEEDED_USER.EMAIL_DOMAIN,
  );

  console.log(
    `Deleted ${cleanupResult.ordersDeleted} orders and ${cleanupResult.usersDeleted} users with prefix '${SEEDED_USER.EMAIL_PREFIX}' and domain '${SEEDED_USER.EMAIL_DOMAIN}'`
  );
}
