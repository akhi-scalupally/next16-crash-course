/**
 * MongoDB / Mongoose connection helper
 *
 * - Uses a global cache to avoid creating multiple connections during
 *   development (hot-reloading) which can exhaust connections.
 * - Exports `connectToDatabase()` which returns the singleton `mongoose`
 *   instance typed as `Mongoose`.
 * - Requires `MONGODB_URI` to be set in the environment.
 */

import mongoose, { Mongoose } from 'mongoose';

declare global {
  // Cached connection across hot reloads in development
  // eslint-disable-next-line no-var
  var _mongooseCache:
    | {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI:string  = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env');
}

const cache = global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null });

/**
 * Connects to MongoDB using mongoose and returns the mongoose instance.
 * Reuses an existing connection when available (important for serverless
 * or hot-reload environments).
 */
async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const options: mongoose.ConnectOptions = {
      bufferCommands: false, // fail fast if the server is down
    };

    cache.promise = mongoose.connect(MONGODB_URI, options).then(() => mongoose);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectToDatabase;
