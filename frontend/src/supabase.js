import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfjhrqwcmdvvdntxcchy.supabase.co'
const supabaseAnonKey = 'sb_publishable_gSnKiGtSaiAhRjz17v00Xw_je4vIqjx'

export const isSupabaseConfigured = true

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
