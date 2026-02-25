// Supabase configuration for the Print Agent
const SUPABASE_URL = 'https://ejmgpxrypogmhgoqpilf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbWdweHJ5cG9nbWhnb3FwaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjM1ODgsImV4cCI6MjA4NzI5OTU4OH0.TK2PdUu4h8DizGUmFko0WJ2kMg4OkBZM6Z3G7xntXqc';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY, FUNCTIONS_URL };
