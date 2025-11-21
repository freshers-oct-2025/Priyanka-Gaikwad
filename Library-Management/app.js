import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Book from "./models/Book.js";

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connected"))
  .catch((e) => console.log("DB Error:", e));

// Auth
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.json({ message: "Token Missing" });

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.json({ message: "Invalid Token" });
  }
}

//Authorization
function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.json({ message: "Access Denied" });
    }
    next();
  };
}

app.post("/register", async (req, res) => {
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

  res.json({ message: "Registered", user });
});


app.post("/login", async (req, res) => {
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

//add
app.post(
  "/books",
  auth,
  authorize(["admin"]),
  async (req, res) => {
    const book = await Book.create({
      title: req.body.title,
      author: req.body.author,
      addedBy: req.userId,
    });

    res.json({ message: "Book Added", book });
  }
);

app.get("/books", async (req, res) => {
  const books = await Book.find();
  res.json({ books });
});


//borrow book
app.post(
  "/borrow/:id",
  auth,
  authorize(["user"]),
  async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) return res.json({ message: "Book Not Found" });

    if (book.isBorrowed)
      return res.json({ message: "Book already borrowed" });

    book.isBorrowed = true;
    book.borrowedBy = req.userId;

    await book.save();

    res.json({ message: "Book Borrowed", book });
  }
);

// Return Book
app.post(
  "/return/:id",
  auth,
  authorize(["user"]),
  async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (!book) return res.json({ message: "Book Not Found" });

    if (book.borrowedBy?.toString() !== req.userId)
      return res.json({ message: "Not your book" });

    book.isBorrowed = false;
    book.borrowedBy = null;

    await book.save();

    res.json({ message: "Book Returned" });
  }
);

app.listen(process.env.PORT, () =>
  console.log(`Server running on : http://localhost:${process.env.PORT}`)
);
