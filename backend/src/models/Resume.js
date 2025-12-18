import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    experience: {
      type: String,
      enum: ["Fresher", "Experienced"],
      default: "Fresher",
    },
    skills: [{ type: String, trim: true }],
    projects: { type: String, default: "" },
    resume_text: { type: String, default: "" },
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;


