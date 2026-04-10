import "dotenv/config";
import { upsertUsersForLoadTest } from "../../../db-util.js";
import { SEEDED_USER } from "../config/constants.js";

async function seedUsers(numberOfUsers = 500) {
    const result = await upsertUsersForLoadTest({
        prefix: SEEDED_USER.EMAIL_PREFIX,
        count: numberOfUsers,
        plainPassword: SEEDED_USER.PASSWORD,
        domain: SEEDED_USER.EMAIL_DOMAIN,
    });

    console.log(
        `Seeded users with prefix '${USER_EMAIL_PREFIX}': matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`
    );
}
