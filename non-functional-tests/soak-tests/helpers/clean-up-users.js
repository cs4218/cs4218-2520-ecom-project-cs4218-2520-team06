import "dotenv/config";
import fs from "fs";
import path from "path";
import { deleteUsersAndOrdersByPrefix } from "../../../db-util.js";
import { SEEDED_USER, TEMP_USER, TEMP_FILE } from "../config/constants.js";

export async function removeUserOrdersAndAccounts(emailPrefix, emailDomain) {
  const cleanupResult = await deleteUsersAndOrdersByPrefix(
    emailPrefix,
    emailDomain,
  );

  console.log(
    `Deleted ${cleanupResult.ordersDeleted} orders and ${cleanupResult.usersDeleted} users with prefix '${emailPrefix}' and domain '${emailDomain}'`
  );
}

removeUserOrdersAndAccounts(SEEDED_USER.EMAIL_PREFIX, SEEDED_USER.EMAIL_DOMAIN).catch((error) => {
  console.error("Failed to clean up seeded soak test users", error);
  process.exit(1);
});

removeUserOrdersAndAccounts(TEMP_USER.EMAIL_PREFIX, TEMP_USER.EMAIL_DOMAIN).catch((error) => {
  console.error("Failed to clean up temp soak test users", error);
  process.exit(1);
});

const dirPath = path.resolve(TEMP_FILE.directory);
if (fs.existsSync(dirPath)) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  console.log("Deleted temp folder");
}