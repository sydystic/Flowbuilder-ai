const supabase = require("../services/supabaseClient");

const profileCache = new Map(); // user.id -> { profile, expiresAt }
const CACHE_TTL_MS = 60000; // 60s cache duration

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or malformed Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Supabase auth error:", error?.message || "User not found");
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Check in-memory cache first to avoid 2-3 DB requests per API call
    const cached = profileCache.get(user.id);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.profile;
      return next();
    }

    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error querying user profile:", profileError.message);
      return res.status(500).json({ error: "Database error during profile lookup" });
    }

    if (!profile) {
      const fullName = user.user_metadata?.full_name || (user.email ? user.email.split("@")[0] : "User");
      const avatarUrl = user.user_metadata?.avatar_url || null;

      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          auth_id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting user profile:", insertError.message);
        return res.status(500).json({ error: "Failed to create user profile" });
      }
      profile = newProfile;
    } else {
      if (profile.email !== user.email) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from("users")
          .update({ email: user.email, updated_at: new Date().toISOString() })
          .eq("auth_id", user.id)
          .select()
          .single();

        if (!updateError && updatedProfile) {
          profile = updatedProfile;
        }
      }
    }

    // Cache user profile and proceed
    profileCache.set(user.id, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
    req.user = profile;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ error: "Internal Server Error in authentication middleware" });
  }
}

module.exports = requireAuth;