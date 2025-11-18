import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import User from "./models/user.js";
import Post from "./models/post.js";

dotenv.config();

const app = express();
app.use(express.json());

// --------------------
// MONGOOSE CONNECTION
// --------------------
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error", err));

// --------------------
// MIDDLEWARE
// --------------------
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = data.id;
    req.userRole = data.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Access Denied" });
    }
    next();
  };
}

// --------------------
// AUTH ROUTES
// --------------------

app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ message: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
  });

  const clean = user.toObject();
  delete clean.password;

  res.json({ message: "signup successfull", clean });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ message: "Incorrect password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  const clean = user.toObject();
  delete clean.password;

  res.json({ message: "Login successful", token, user: clean });
});

// --------------------
// USER ROUTES
// --------------------

app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

app.put("/me", auth, async (req, res) => {
  const { name } = req.body;

  const updated = await User.findByIdAndUpdate(
    req.userId,
    { name },
    { new: true }
  ).select("-password");

  if (updated) {
    return res.json({ message: "Already Updated" });
  }

  res.json({ message: "Profile updated", user: updated });
});

app.post("/posts", auth, async (req, res) => {
  const post = await Post.create({
    title: req.body.title,
    content: req.body.content,
    createdBy: req.userId,
  });

  res.json({ message: "Post created", post });
});

app.get("/my-posts", auth, async (req, res) => {
  const posts = await Post.find({ createdBy: req.userId });
  res.json(posts);
});

// --------------------
// ADMIN ROUTES
// --------------------

app.get("/admin/users", auth, authorize(["admin"]), async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});
app.get("/admin/allPost", auth, authorize(["admin"]), async (req, res) => {
  const allPost = await Post.find();
  res.json(allPost);
});

app.delete("/admin/users/:id", auth, authorize(["admin"]), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

app.put(
  "/admin/users/:id/role",
  auth,
  authorize(["admin"]),
  async (req, res) => {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");

    res.json({ message: "User role updated", updated });
  }
);

app.delete("/admin/posts/:id", auth, authorize(["admin"]), async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted by admin" });
});

// --------------------
// SERVER
// --------------------

app.listen(process.env.PORT, () => {
  console.log(`Server running on : http://localhost:${process.env.PORT}`);
});
