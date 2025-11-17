import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/user.js";

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connection successful");
  })
  .catch((err) => {
    console.log("Connection unsuccessful:", err);
  });

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.json({ message: "No token  provided" });
  }

  const token = header.split(" ")[1];

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = data.id;
    next();
  } catch (err) {
    return res.json({ message: "Invalid Token" });
  }
}
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.json({ message: "Email already exist" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  res.status(201).json({ message: "Sign up successfully", user });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "User not Found" });
  }

  const valid =  await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.json({ message: "password is incorrect" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ message: "login successfully", token });
});

app.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port: http://localhost:${process.env.PORT}`);
});
