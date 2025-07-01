import { supabase } from "./supabase";

// Simple auth functions
export const signUp = async (
    email: string,
    password: string,
    name?: string
) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name || "",
                },
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "An unexpected error occurred" };
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "An unexpected error occurred" };
    }
};

export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: "An unexpected error occurred" };
    }
};

// Get current user session
export const getCurrentUser = async () => {
    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            return { user: null, error: error.message };
        }

        return { user, error: null };
    } catch (error) {
        return { user: null, error: "An unexpected error occurred" };
    }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
    const { user } = await getCurrentUser();
    return user !== null;
};

// Listen to auth state changes
export const onAuthStateChange = (
    callback: (event: string, session: any) => void
) => {
    return supabase.auth.onAuthStateChange(callback);
};
