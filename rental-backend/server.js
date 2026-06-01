import app from "./src/app.js";
import env from "./src/config/env.config.js";
import connectDB from "./src/config/database.js";

const PORT = env.server.port;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.error("Failed to connect to the database. Server not started.");
    process.exit(1);
  });
