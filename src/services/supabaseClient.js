
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://pjokgfpmbhjtjlmcmtiz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2tnZnBtYmhqdGpsbWNtdGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjQ1NjMsImV4cCI6MjA4ODkwMDU2M30.HOMRQUNOHhKFXOZR5H80Pe-xiRgZ0XiujTq-4TCebH0"

export const supabase = createClient(supabaseUrl, supabaseKey)