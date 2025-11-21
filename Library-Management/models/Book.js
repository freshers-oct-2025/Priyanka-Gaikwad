import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  isBorrowed: { type: Boolean, default: false },
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Book = mongoose.model("Book", bookSchema);
export default Book;