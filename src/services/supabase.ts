// Supabase client configuration for mobile app
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = "https://uelshvuhoqfbsfiyqdha.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbHNodnVob3FmYnNmaXlxZGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDEzNzgsImV4cCI6MjA4MzExNzM3OH0.8RK1JHgQ70YrOntSnqZq8SXvDvMK1YS-zT5ZC6o-W3Q";

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Not needed for mobile
    },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
