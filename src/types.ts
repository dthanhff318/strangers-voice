export interface Profile {
  id: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  background_id: string | null;
  current_plan_id: string | null;
  plan_upgraded_at: string | null;
  plan_expires_at: string | null;
}
