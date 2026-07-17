import mongoose from "mongoose";
import { app } from "./app";
import { env } from "./config/env";

async function startServer(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

startServer().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`Failed to start server: ${error.message}`);
  } else {
    console.error("Failed to start server due to unknown error");
  }
  process.exit(1);
});

