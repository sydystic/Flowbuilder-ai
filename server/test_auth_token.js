const supabase = require("./services/supabaseClient");

async function main() {
  const email = "siddharth@example.com";
  const password = "TestPassword123!";
  
  console.log("Checking if user exists by signing in...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError && signInData.session) {
    console.log("SUCCESS: User already exists. Signed in successfully!");
    console.log("TOKEN:" + signInData.session.access_token);
    return;
  }
  
  console.log("Sign in failed. Attempting to create user via Admin API (auto-confirmed)...");
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Siddharth Kurne",
      avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkWlDbCQnjRS8tZsr_5JP_S3UqPb3KjB55ThqKgI9G17LBBvW9bA7xHncGQe-s2UtATJPfqBbITMBH_j3WXc9GcY5GjdtxlCAarjAuzgi5Q0oZvzyhOYhlYkYIbrs526etpTdW1FAzOKUaM5d44N8P6Iaq2ipUorVOBi2uA8zJNhXIvYOHpM_Qcgkyiu_ctlJt_9okTfAkd0MJHs0zgnTEyI4CwIxggOCvjylNKySUHoSaBRDnFWQybPnXuz72ncNwbQ7zN6TwAIg7"
    }
  });

  if (createError) {
    console.error("Admin user creation failed:", createError.message);
    return;
  }

  console.log("User created via admin API. Signing in again to generate token...");
  const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError2) {
    console.error("Failed to sign in after creation:", signInError2.message);
    return;
  }

  console.log("SUCCESS: Sign In Successful!");
  console.log("TOKEN:" + signInData2.session.access_token);
}

main().catch(err => console.error("Unhandled error:", err));
