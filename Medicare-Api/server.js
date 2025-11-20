import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Models
import User from "./models/User.js";
import Doctor from "./models/Doctor.js";
import Appointment from "./models/Appointment.js";

dotenv.config();

const app = express();
app.use(express.json());

// DB connect
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

// Middleware: Auth
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.json({ message: "No Token Provided" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.json({ message: "Invalid Token" });
  }
}

// Middleware: Check role
function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.json({ message: "Access Denied" });
    }
    next();
  };
}

/* =====================================================
   AUTH ROUTES
===================================================== */

// Register
app.post("/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
  });

  res.json({ message: "Register Success", user });
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ message: "User Not Found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ message: "Wrong Password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET
  );

  res.json({ message: "Login Successful", token });
});

/* =====================================================
   DOCTOR ROUTES
===================================================== */

// Add doctor (admin only)
app.post("/admin/doctors", auth, authorize(["admin"]), async (req, res) => {
  const doctor = await Doctor.create({
    name: req.body.name,
    specialization: req.body.specialization,
    experience: req.body.experience,
    createdBy: req.userId,
  });

  res.json({ message: "Doctor Added", doctor });
});

// Public: Get doctors
app.get("/doctors", async (req, res) => {
  const doctors = await Doctor.find();
  res.json({ doctors });
});

/* =====================================================
   APPOINTMENTS
===================================================== */

// Create appointment (patient)
app.post("/appointments", auth, authorize(["patient"]), async (req, res) => {
  const appointment = await Appointment.create({
    userId: req.userId,
    doctorId: req.body.doctorId,
    date: req.body.date,
    time: req.body.time,
  });

  res.json({ message: "Appointment Booked", appointment });
});

// My appointments
app.get("/appointments", auth, async (req, res) => {
  const data = await Appointment.find({ userId: req.userId })
    .populate("doctorId", "name specialization")
    .populate("userId", "name");

  res.json({ appointments: data });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
