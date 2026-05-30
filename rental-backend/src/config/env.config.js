import dotenv from "dotenv";

dotenv.config();

const env = {
  server: {
    port: process.env.PORT || 5000,
  },
  database: {
    mongoURI: process.env.MONGO_URI,
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};

export default env;
