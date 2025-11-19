import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "./models/User.js";
import Event from "./models/Event.js";
import Registration from "./models/Registration.js";

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.json({ message: "No Token Provided" });
  }
  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.json({ message: "Invalid Token" });
  }
}

function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.json({ message: "Access Denied" });
    }
    next();
  };
}

// Register
app.post("/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, password: hashed, role });
  res.json({ message: "Register Success", user });
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "User Not Found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.json({ message: "Wrong Password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  res.json({ message: "Login Successful", token });
});

// events public
app.get("/events", async (req, res) => {
  const events = await Event.find();
  res.json({ events });
});

app.get("/events/:id", async (req, res) => {
  const event = await Event.findById(req.params.id);
  res.json({ event });
});

//admin routes
app.post("/admin/events", auth, authorize(["admin"]), async (req, res) => {
  const event = await Event.create({
    title: req.body.title,
    description: req.body.description,
    date: req.body.date,
    category: req.body.category,
    location: req.body.location,
    createdBy: req.userId,
  });

  res.json({ message: "Event Created", event });
});

app.put("/admin/events/:id", auth, authorize(["admin"]), async (req, res) => {
  const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!updated) return res.json({ message: "Event Not Found" });

  res.json({ message: "Event Updated", updated });
});

app.delete(
  "/admin/events/:id",
  auth,
  authorize(["admin"]),
  async (req, res) => {
    const deleted = await Event.findByIdAndDelete(req.params.id);

    if (!deleted) return res.json({ message: "Event Already Deleted" });

    res.json({ message: "Event Deleted", deleted });
  }
);

// registration
app.post("/register/:eventId", auth, async (req, res) => {
  const eventId = req.params.eventId;

  const exists = await Registration.findOne({
    userId: req.userId,
    eventId,
  });

  if (exists) return res.json({ message: "Already Registered" });

  const reg = await Registration.create({ userId: req.userId, eventId });

  res.json({ message: "Registered Successfully", reg });
});

app.delete("/register/:eventId", auth, async (req, res) => {
  const eventId = req.params.eventId;

  const deleted = await Registration.findOneAndDelete({
    userId: req.userId,
    eventId,
  });

  if (!deleted) return res.json({ message: "Not Registered Yet" });

  res.json({ message: "Registration Cancelled", deleted });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
