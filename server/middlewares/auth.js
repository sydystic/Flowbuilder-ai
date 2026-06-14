const supabase = require("../services/supabaseClient");

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

    // Call Supabase Auth to retrieve the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("Supabase auth error:", error?.message || "User not found");
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Sync profile in public.users table
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
      // Lazy create profile
      const fullName = user.user_metadata?.full_name || user.email.split("@")[0];
      const avatarUrl = user.user_metadata?.avatar_url || null;

      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          auth_id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting user profile:", insertError.message);
        return res.status(500).json({ error: "Failed to create user profile" });
      }
      profile = newProfile;
    } else {
      // Sync if email changed
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

    // Bind public.users profile row to the request object
    req.user = profile;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ error: "Internal Server Error in authentication middleware" });
  }
}

module.exports = requireAuth;
