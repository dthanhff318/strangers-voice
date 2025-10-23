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
    // Create Supabase client with user's auth for verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get current user to verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body
    const { recordingId } = await req.json();

    if (!recordingId) {
      return new Response(
        JSON.stringify({ error: "Recording ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Fetch the recording to verify ownership and get file URL (using service role to bypass RLS)
    const { data: recording, error: fetchError } = await supabaseAdmin
      .from("recordings")
      .select("id, user_id, file_url")
      .eq("id", recordingId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: "Recording not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verify ownership
    if (recording.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't own this recording" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Extract filename from URL
    const urlParts = recording.file_url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    // Delete record from database using service role (bypasses RLS)
    const { error: dbError, count } = await supabaseAdmin
      .from("recordings")
      .delete({ count: "exact" })
      .eq("id", recordingId);

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Failed to delete recording from database" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Check if any rows were actually deleted
    if (count === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to delete recording. RLS policy may have blocked the operation." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Delete file from storage only after successful database deletion (using service role)
    await supabaseAdmin.storage
      .from("audio-recordings")
      .remove([fileName]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Recording deleted successfully",
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
