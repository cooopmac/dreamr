import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://glaivnpamytqfcgobeiz.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYWl2bnBhbXl0cWZjZ29iZWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTkzODIsImV4cCI6MjA2Njg5NTM4Mn0.2Oi5804qBebgvT2mrI_0h-TgewtsNeFHKmuV8jsF_K0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
