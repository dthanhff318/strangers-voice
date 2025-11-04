// VIP Membership Types

export interface Plan {
  id: string
  name: 'silver' | 'gold' | 'diamond'
  display_name: string
  description: string | null
  price: number
  features: string[]
  badge_color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  background_id: string | null
  current_plan_id: string | null
  plan_upgraded_at: string | null
  plan_expires_at: string | null
}

export interface ProfileWithPlan extends UserProfile {
  plan?: Plan | null
}
