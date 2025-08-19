import mongoose from "mongoose";

// This function will connect our application to MongoDB
export async function connectDB() {
  // Get the connection string from environment variables (.env file)
  const uri = process.env.MONGODB_URI;
  
  // If the URI is not provided, throw an error so the app fails fast
  if (!uri) throw new Error("MONGODB_URI not set");

  // Connect to MongoDB with Mongoose
  // - uri: the cluster URL from Atlas or local MongoDB
  // - dbName: optional database name, default is "trash2cash"
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "trash2cash" });

  // If successful, log to console
  console.log("✅ MongoDB connected");
}
