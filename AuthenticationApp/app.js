import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./models/authApp.js";

const app = express();
app.use(express.json());

// connect DB
mongoose.connect("mongodb://127.0.0.1:27017/jwtdemo");

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // check user exists
  const exists = await User.findOne({ email });
  if (exists) return res.json({ message: "Email already used" });

  // hash password
  const hashed = await bcrypt.hash(password, 10);

  // save user
  const user = await User.create({ email, password: hashed });

  res.json({ message: "Signup successful" });
});

// SIGNIN
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  // find user
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "Invalid credentials" });

  // check password
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ message: "Invalid credentials" });

  // create token
  const token = jwt.sign({ id: user._id }, "secret123", {
    expiresIn: "1h",
  });

  res.json({ token });
});

// middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.json({ message: "No token" });

  const token = header.split(" ")[1];
  try {
    const data = jwt.verify(token, "secret123");
    req.userId = data.id;
    next();
  } catch {
    res.json({ message: "Invalid token" });
  }
}

// protected route
app.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on : http://localhost:${port}`);
});
