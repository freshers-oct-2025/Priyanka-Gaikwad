
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["admin", "patient"], default: "patient" }
});

export default mongoose.model("User", userSchema);
