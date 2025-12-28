// lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

// Definice typů pro TypeScript (zatím any, později nahradíme vygenerovanými typy z databáze)
// Až budeš mít tabulky, spustíme: npx supabase gen types typescript
type Database = any;

// Načtení proměnných prostředí
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Kontrola, zda proměnné existují (pro debugování)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Chybí Supabase URL nebo Anon Key. Zkontroluj soubor .env.local')
}

// Vytvoření a export klienta
// Tuto instanci budeme importovat v komponentách
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)