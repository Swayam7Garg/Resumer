import express from "express";
import Resume from "../models/Resume.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Search resumes
router.get(
  "/search",
  authRequired,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const {
        q,
        skills: skillsFilter,
        role,
        experience,
        page = 1,
        page_size = 5,
      } = req.query;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const pageSizeNum = Math.min(
        Math.max(parseInt(page_size, 10) || 5, 1),
        50
      );

      const filter = {};

      if (q) {
        const regex = new RegExp(q, "i");
        filter.$or = [
          { name: regex },
          { email: regex },
          { role: regex },
          { projects: regex },
          { resume_text: regex },
        ];
      }

      if (skillsFilter) {
        const skillsArr = String(skillsFilter)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (skillsArr.length) {
          filter.skills = { $in: skillsArr };
        }
      }

      if (role) {
        filter.role = new RegExp(`^${role}$`, "i");
      }

      if (experience) {
        filter.experience = experience;
      }

      const total = await Resume.countDocuments(filter);
      const items = await Resume.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSizeNum)
        .limit(pageSizeNum)
        .lean();

      return res.json({
        page: pageNum,
        page_size: pageSizeNum,
        total,
        items: items.map((r) => ({
          id: r._id.toString(),
          name: r.name,
          email: r.email,
          role: r.role,
          experience: r.experience,
          skills: r.skills || [],
          projects: r.projects || "",
          resume_text: r.resume_text || "",
        })),
      });
    } catch (err) {
      console.error("Search resumes error", err);
      return res.status(500).json({ message: "Failed to search resumes" });
    }
  }
);

export default router;


