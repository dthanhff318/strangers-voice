# Supabase Edge Functions Guide

## Tại sao dùng Edge Functions?

1. **Security**: Giấu business logic và API keys khỏi client
2. **Performance**: Chạy gần user (edge network)
3. **Backend Logic**: Xử lý phức tạp ở server thay vì client
4. **Database Security**: Không expose DB schema và RLS policies cho client

## Cấu trúc cơ bản

### 1. Edge Function Structure

```
supabase/
└── functions/
    └── function-name/
        └── index.ts
```

### 2. Basic Template

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Your logic here

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
```

## Examples

### Example 1: GET Request (List Data)

**Edge Function:**
```typescript
// supabase/functions/get-recordings/index.ts
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(/* ... */);

  const { data, error } = await supabaseClient
    .from("recordings")
    .select("*, profiles!user_id(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

**Frontend Call:**
```typescript
import { supabase } from "./lib/supabase";

const { data, error } = await supabase.functions.invoke("get-recordings");
```

### Example 2: POST Request (Create/Update)

**Edge Function:**
```typescript
// supabase/functions/like-recording/index.ts
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { recordingId } = await req.json();

  if (!recordingId) {
    throw new Error("recordingId is required");
  }

  const supabaseClient = createClient(/* ... */);

  // Get current user
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check if already liked
  const { data: existingLike } = await supabaseClient
    .from("user_likes")
    .select()
    .eq("user_id", user.id)
    .eq("recording_id", recordingId)
    .single();

  if (existingLike) {
    // Unlike
    await supabaseClient
      .from("user_likes")
      .delete()
      .eq("id", existingLike.id);

    return new Response(JSON.stringify({ liked: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } else {
    // Like
    await supabaseClient
      .from("user_likes")
      .insert({ user_id: user.id, recording_id: recordingId });

    return new Response(JSON.stringify({ liked: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

**Frontend Call:**
```typescript
const { data, error } = await supabase.functions.invoke("like-recording", {
  body: { recordingId: "123" }
});
```

### Example 3: Complex Logic (Statistics)

**Edge Function:**
```typescript
// supabase/functions/get-user-stats/index.ts
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { userId } = await req.json();
  const supabaseClient = createClient(/* ... */);

  // Multiple queries in parallel
  const [recordings, likes, followers] = await Promise.all([
    supabaseClient
      .from("recordings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabaseClient
      .from("user_likes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabaseClient
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId),
  ]);

  const stats = {
    totalRecordings: recordings.count || 0,
    totalLikes: likes.count || 0,
    totalFollowers: followers.count || 0,
  };

  return new Response(JSON.stringify({ data: stats }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

## Frontend Helper Functions

Create a centralized file for all edge function calls:

```typescript
// src/lib/edgeFunctions.ts
import { supabase } from "./supabase";

export async function callEdgeFunction<T = any>(
  functionName: string,
  body?: any
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {},
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    return { data: null, error: error as Error };
  }
}

// Specific functions
export const getRecordings = () => callEdgeFunction("get-recordings");
export const likeRecording = (recordingId: string) =>
  callEdgeFunction("like-recording", { recordingId });
export const getUserStats = (userId: string) =>
  callEdgeFunction("get-user-stats", { userId });
```

## Deployment

```bash
# Deploy single function
supabase functions deploy get-recordings

# Deploy all functions
supabase functions deploy

# View logs
supabase functions logs get-recordings
```

## Environment Variables

Set secrets for edge functions:

```bash
# Set secret
supabase secrets set MY_SECRET=value

# List secrets
supabase secrets list
```

Use in edge function:
```typescript
const apiKey = Deno.env.get("MY_SECRET");
```

## Best Practices

1. **Always handle CORS** - Include CORS headers in responses
2. **Use RLS** - Edge functions respect Row Level Security policies
3. **Error Handling** - Return proper error messages and status codes
4. **Authentication** - Pass auth token from client to edge function
5. **Type Safety** - Use TypeScript for both edge functions and client calls
6. **Logging** - Use `console.log()` for debugging (viewable in Supabase dashboard)
7. **Keep it Simple** - Don't put too much logic in one function
8. **Cache When Possible** - Use Deno's caching for external dependencies

## Common Patterns

### Pattern 1: Authenticated Requests

```typescript
// Get current user in edge function
const { data: { user } } = await supabaseClient.auth.getUser();
if (!user) throw new Error("Unauthorized");
```

### Pattern 2: Query Parameters

```typescript
const url = new URL(req.url);
const limit = url.searchParams.get("limit") || "10";
```

### Pattern 3: File Upload

```typescript
const formData = await req.formData();
const file = formData.get("file") as File;
```

## Migration from Direct DB Calls

**Before:**
```typescript
const { data } = await supabase.from("table").select("*");
```

**After:**
```typescript
const { data } = await supabase.functions.invoke("get-data");
```

## Troubleshooting

1. **CORS errors**: Make sure to include CORS headers
2. **Auth errors**: Pass Authorization header from client
3. **Timeout**: Functions timeout after 60 seconds
4. **Cold starts**: First request may be slower

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
