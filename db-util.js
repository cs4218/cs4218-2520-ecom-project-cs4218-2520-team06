// db-utils.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URL;

const client = new MongoClient(uri);

// Use for test cleanups
export async function deleteUserByEmail(email) {
  try {
    await client.connect();
    const users = client.db().collection("users");
    await users.deleteOne({ email: email });
  } finally {
    await client.close();
  }
}
