// Kok Bo Chang, A0273542E
import "dotenv/config";
import fs from "fs";
import path from "path";
import { upsertUsersForLoadTest } from "../../../db-util.js";
import { SEEDED_USER, TEMP_FILE } from "../config/constants.js";

export async function seedUsers(emailPrefix, emailDomain, password, numberOfUsers = 300) {
    const result = await upsertUsersForLoadTest({
        prefix: emailPrefix,
        domain: emailDomain,
        count: numberOfUsers,
        plainPassword: password,
    });

    console.log(
        `Seeded users with prefix '${emailPrefix}': matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`
    );

    const dirPath = path.resolve(TEMP_FILE.directory);
    const filePath = path.join(dirPath, TEMP_FILE.fileName);

    // create folder if it doesn't exist
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(
        filePath,
        JSON.stringify(result.emails, null, 2)
    );

    return;
}

seedUsers(SEEDED_USER.EMAIL_PREFIX, SEEDED_USER.EMAIL_DOMAIN, SEEDED_USER.PASSWORD).catch((error) => {
    console.error("Failed to seed soak test users", error);
    process.exit(1);
});