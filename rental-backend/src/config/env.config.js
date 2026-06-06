import dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// Required environment variable validation
// Fail fast on startup if any critical secret is missing.
// ---------------------------------------------------------------------------
const REQUIRED_VARS = [
  "MONGO_URI",
  "JWT_ACCESSTOKEN_SECRET",
  "JWT_REFRESHTOKEN_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "EMAIL_USERNAME",
  "EMAIL_PASSWORD",
];

const missingVars = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `[STARTUP ERROR] Missing required environment variables:\n  - ${missingVars.join("\n  - ")}\n` +
    `Please check your .env file.`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Centralized environment configuration object
// All environment access goes through this — never use process.env directly.
// ---------------------------------------------------------------------------
const env = {
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  },
  database: {
    mongoURI: process.env.MONGO_URI,
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESSTOKEN_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESHTOKEN_SECRET,
    accessTokenExpiresIn: process.env.JWT_ACCESSTOKEN_EXPIRES_IN || "30m",
    refreshTokenExpiresIn: process.env.JWT_REFRESHTOKEN_EXPIRES_IN || "7d",
    // Pre-computed refresh token TTL in milliseconds for consistent usage
    refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  email: {
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },
};

export default env;
