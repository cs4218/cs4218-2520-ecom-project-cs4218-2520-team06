import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { deleteUsersAndOrdersByPrefix } from "../../../db-util.js";
import { USER_EMAIL_PREFIX, USER_EMAIL_DOMAIN } from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  const cleanupResult = await deleteUsersAndOrdersByPrefix(
    USER_EMAIL_PREFIX,
    USER_EMAIL_DOMAIN
  );

  console.log(
    `Deleted ${cleanupResult.ordersDeleted} orders and ${cleanupResult.usersDeleted} users for prefix='${USER_EMAIL_PREFIX}' domain='${USER_EMAIL_DOMAIN}'`
  );
}

main().catch((error) => {
  console.error("Failed to cleanup stress test users", error);
  process.exit(1);
});
