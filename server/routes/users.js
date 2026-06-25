const express = require("express");
const router = express.Router();
const supabase = require("../services/supabaseClient");
const requireAuth = require("../middlewares/auth");

// PUT /api/users/profile -> Update user's full name and avatar
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: "fullName is required" });
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) {
      console.error("DB error updating profile:", error.message);
      throw error;
    }

    res.json(updated);
  } catch (err) {
    console.error("Update profile route error:", err.message);
    res.status(500).json({ error: `Failed to update profile: ${err.message}` });
  }
});

// GET /api/users/profile -> Get current logged-in user's profile details
router.get("/profile", requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
