// db-utils.js
import "dotenv/config";
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
