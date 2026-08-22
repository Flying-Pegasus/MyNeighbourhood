import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/myneighbourhood";

  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error.message);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected from database.");
  });
}
