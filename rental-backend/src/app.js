import express from "express";
import env from "dotenv";

const app = express();
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
