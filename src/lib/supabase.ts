import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client — use in Client Components
// Uses @supabase/ssr so the session is stored in cookies (readable by the proxy/middleware)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
