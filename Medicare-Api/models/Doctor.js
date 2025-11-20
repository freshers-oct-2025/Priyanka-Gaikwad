import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  experience: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Doctor", doctorSchema);
