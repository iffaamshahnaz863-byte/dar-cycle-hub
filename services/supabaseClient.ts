
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dwlffwkrpwmskremlyey.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bGZmd2tycHdtc2tyZW1seWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTg5MTgsImV4cCI6MjA4NTc3NDkxOH0.7l2jtFNkC1p3o3uXIQX-Sh4nHbWt73eTOqLeHEZXhq8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
