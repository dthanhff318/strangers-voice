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
    // Create Supabase client with SERVICE ROLE KEY
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

    // Get userId from request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if current user follows the target user
    const { data: followData, error: followError } = await supabaseAdmin
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single();

    if (followError && followError.code !== "PGRST116") {
      // PGRST116 = no rows returned (not following)
      return new Response(
        JSON.stringify({ error: "Failed to check follow status" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const isFollowing = !!followData;

    // Get followers count (who follows this user)
    const { count: followersCount, error: followersError } = await supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    // Get following count (who this user follows)
    const { count: followingCount, error: followingError } = await supabaseAdmin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followersError || followingError) {
      return new Response(
        JSON.stringify({ error: "Failed to get follow counts" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        isFollowing,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
