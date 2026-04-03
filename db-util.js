// db-utils.js
import "dotenv/config";
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";

function createClient() {
  const uri = process.env.MONGO_URL;

  if (!uri) {
    throw new Error(
      "MONGO_URL is not set. Set it before running e2e DB cleanup helpers."
    );
  }

  return new MongoClient(uri);
}

// Use for test cleanups
export async function deleteUserByEmail(email) {
  const client = createClient();

  try {
    await client.connect();
    const users = client.db().collection("users");
    await users.deleteOne({ email: email });
  } finally {
    await client.close();
  }
}

export async function deleteUsersOrdersByEmail(email) {
  const client = createClient();

  try {
    await client.connect();
    const users = client.db().collection("users");

    const user = await users.findOne(
      { email: email },
      { projection: { _id: 1 } }
    );
    if (!user) {
      return 0;
    }

    const orders = client.db().collection("orders");
    const result = await orders.deleteMany({ buyer: user._id });
    return result.deletedCount;
  } finally {
    await client.close();
  }
}

export async function setUserAsAdmin(email) {
  const client = createClient();

  try {
    await client.connect();
    const users = client.db().collection("users");

    const user = await users.findOneAndUpdate(
      { email: email },
      { $set: { role: 1 } }
    );
    if (!user) {
      return false;
    }

    return true;
  } finally {
    await client.close();
  }
}

export async function upsertUsersForLoadTest({
  prefix,
  count,
  plainPassword,
  name = "Test User",
  phone = "1234567890",
  address = "123 Test St",
  answer = "example",
  role = 0,
  domain = "test.com",
}) {
  if (!prefix) {
    throw new Error("prefix is required");
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("count must be a positive integer");
  }
  if (!plainPassword) {
    throw new Error("plainPassword is required");
  }

  const client = createClient();

  try {
    await client.connect();
    const users = client.db().collection("users");
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const now = new Date();

    const operations = Array.from({ length: count }, (_, index) => {
      const email = `${prefix}-${index}@${domain}`;
      return {
        updateOne: {
          filter: { email: email },
          update: {
            $set: {
              name: name,
              password: hashedPassword,
              phone: phone,
              address: address,
              answer: answer,
              role: role,
              updatedAt: now,
            },
            $setOnInsert: {
              email: email,
              createdAt: now,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await users.bulkWrite(operations, { ordered: false });

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  } finally {
    await client.close();
  }
}

export async function deleteUsersAndOrdersByPrefix(
  prefix,
  domain = "test.com"
) {
  if (!prefix) {
    throw new Error("prefix is required");
  }

  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const emailPattern = new RegExp(`^${escapedPrefix}.*@${escapedDomain}$`);

  const client = createClient();

  try {
    await client.connect();
    const users = client.db().collection("users");
    const orders = client.db().collection("orders");

    const matchingUsers = await users
      .find({ email: { $regex: emailPattern } }, { projection: { _id: 1 } })
      .toArray();

    const userIds = matchingUsers.map((user) => user._id);
    let ordersDeleted = 0;

    if (userIds.length > 0) {
      const orderDeleteResult = await orders.deleteMany({
        buyer: { $in: userIds },
      });
      ordersDeleted = orderDeleteResult.deletedCount;
    }

    const userDeleteResult = await users.deleteMany({
      email: { $regex: emailPattern },
    });

    return {
      ordersDeleted: ordersDeleted,
      usersDeleted: userDeleteResult.deletedCount,
    };
  } finally {
    await client.close();
  }
}
