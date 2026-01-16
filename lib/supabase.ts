import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eoefipjqrlhnkfzaigfx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZWZpcGpxcmxobmtmemFpZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDQzNjAsImV4cCI6MjA4MjU4MDM2MH0.jJ3vzqdFS1HEfYdxcdInbj1pZ2JaE8Mv2_wGhjFYLuw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
