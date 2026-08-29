const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });


  const authRoutes = require("./routes/authRoutes");

app.get("/server-test", (req, res) => {
  res.send("Server test is working!");
});

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("ToggleNest Backend is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

