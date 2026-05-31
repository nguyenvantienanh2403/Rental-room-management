import dotenv from "dotenv";

dotenv.config();

const env = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  database: {
    mongoURI: process.env.MONGO_URI,
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESSTOKEN_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESHTOKEN_SECRET,
    accessTokenExpiresIn: process.env.JWT_ACCESSTOKEN_EXPIRES_IN || "30m",
    refreshTokenExpiresIn: process.env.JWT_REFRESHTOKEN_EXPIRES_IN || "7d",
  },
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10"),
};

export default env;
