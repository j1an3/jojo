import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public read-only client — safe to use in browser components.
// Uses the `anon` key with RLS policies enforcing public read access.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
