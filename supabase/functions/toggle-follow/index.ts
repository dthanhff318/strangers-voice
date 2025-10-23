import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with SERVICE ROLE KEY (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Get request body
    const { userId, action } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Prevent self-follow
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot follow yourself" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Verify target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Check if action is provided, otherwise toggle
    let finalAction = action;

    if (!finalAction) {
      // Check current follow status
      const { data: existingFollow } = await supabaseAdmin
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .single();

      finalAction = existingFollow ? "unfollow" : "follow";
    }

    if (finalAction === "follow") {
      // Follow user
      const { error: followError } = await supabaseAdmin
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (followError) {
        // Check if already following (unique constraint violation)
        if (followError.code === "23505") {
          return new Response(
            JSON.stringify({ error: "Already following this user" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        return new Response(
          JSON.stringify({ error: "Failed to follow user", details: followError.message }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully followed user",
          isFollowing: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (finalAction === "unfollow") {
      // Unfollow user
      const { error: unfollowError } = await supabaseAdmin
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (unfollowError) {
        return new Response(
          JSON.stringify({ error: "Failed to unfollow user", details: unfollowError.message }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully unfollowed user",
          isFollowing: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "follow" or "unfollow"' }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
