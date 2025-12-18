import express from "express";
import Resume from "../models/Resume.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get own resume
router.get("/resume", authRequired, requireRole("candidate"), async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.json(null);
    }
    return res.json({
      id: resume._id.toString(),
      name: resume.name,
      email: resume.email,
      role: resume.role,
      experience: resume.experience,
      skills: resume.skills,
      projects: resume.projects,
      resume_text: resume.resume_text,
    });
  } catch (err) {
    console.error("Get resume error", err);
    return res.status(500).json({ message: "Failed to fetch resume" });
  }
});

// Create resume
router.post("/resume", authRequired, requireRole("candidate"), async (req, res) => {
  try {
    const { name, email, role, experience, skills, projects, resume_text } =
      req.body || {};

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email and role are required" });
    }

    const existing = await Resume.findOne({ userId: req.user._id });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You already have a resume. Use update instead." });
    }

    const resume = await Resume.create({
      userId: req.user._id,
      name,
      email,
      role,
      experience: experience || "Fresher",
      skills: Array.isArray(skills) ? skills : [],
      projects: projects || "",
      resume_text: resume_text || "",
    });

    return res.status(201).json({
      id: resume._id.toString(),
    });
  } catch (err) {
    console.error("Create resume error", err);
    return res.status(500).json({ message: "Failed to create resume" });
  }
});

// Update resume
router.put(
  "/resume/:id",
  authRequired,
  requireRole("candidate"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, experience, skills, projects, resume_text } =
        req.body || {};

      const resume = await Resume.findOne({ _id: id, userId: req.user._id });
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (name) resume.name = name;
      if (email) resume.email = email;
      if (role) resume.role = role;
      if (experience) resume.experience = experience;
      if (skills) resume.skills = Array.isArray(skills) ? skills : resume.skills;
      if (projects !== undefined) resume.projects = projects;
      if (resume_text !== undefined) resume.resume_text = resume_text;

      await resume.save();

      return res.json({ message: "Updated" });
    } catch (err) {
      console.error("Update resume error", err);
      return res.status(500).json({ message: "Failed to update resume" });
    }
  }
);

// Delete resume
router.delete(
  "/resume/:id",
  authRequired,
  requireRole("candidate"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const resume = await Resume.findOneAndDelete({
        _id: id,
        userId: req.user._id,
      });
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      return res.json({ message: "Deleted" });
    } catch (err) {
      console.error("Delete resume error", err);
      return res.status(500).json({ message: "Failed to delete resume" });
    }
  }
);

export default router;


