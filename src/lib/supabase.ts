import { createClient } from '@supabase/supabase-js'

const fallbackSupabaseUrl = 'https://hzesigjnerfviumzkeze.supabase.co'
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZXNpZ2puZXJmdml1bXprZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODA5MzYsImV4cCI6MjA5Njg1NjkzNn0.EQH-PBze--llWonByLW6OT5HknhXLqLMY-LJvejJTP8'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'scoutly-auth-session',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null
