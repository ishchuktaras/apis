import { createBrowserClient } from '@supabase/ssr'

// Definice typů (zatím any, později nahradíme)
type Database = any;

// Načtení proměnných prostředí
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Chybí Supabase URL nebo Anon Key v .env.local')
}

// Vytvoření a export klienta, který pracuje s Cookies (pro Middleware)
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)