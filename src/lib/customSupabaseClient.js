import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqykqxuydbwdjjcyaiwa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xeWtxeHV5ZGJ3ZGpqY3lhaXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODIzMjMsImV4cCI6MjA4NjM1ODMyM30.xMPZmvFFx8blBvBUjP_vY_cJSP_1ja6uxMdEN-mcTy0';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
