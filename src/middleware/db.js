import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "myneighbourhood";

let client;
let db;

export async function connectDb() {
  if (db) return db;
  if (!uri) throw new Error("MONGODB_URI is not configured.");

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log(`[DB] Connected to MongoDB database: ${dbName}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database has not been initialized. Call connectDb() first.");
  return db;
}

export async function closeDb() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}
