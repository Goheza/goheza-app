// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // Using the powerful Service Key

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Key environment variables.')
}

export const serverSupabaseClient = createClient(supabaseUrl, supabaseServiceKey)

// You can export other utility functions here if needed
// e.g., for getting a client with the user's cookie/session (middleware required)
