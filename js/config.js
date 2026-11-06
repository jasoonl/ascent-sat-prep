/* Cloud accounts are OFF until both values below are filled in. See docs/ACCOUNTS.md.
   The anon key is meant to be public: Row Level Security (supabase/schema.sql) is what protects each student's data.
   Never put a service_role key here. */
window.ASCENT_CONFIG = Object.assign({ supabaseUrl: '', supabaseAnonKey: '' }, window.ASCENT_CONFIG || {});
