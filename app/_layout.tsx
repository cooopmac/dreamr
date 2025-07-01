import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { getCurrentUser, onAuthStateChange } from "../utils/userAuth";

export default function RootLayout() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthState();

        // Listen for auth state changes
        const {
            data: { subscription },
        } = onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event);

            if (event === "SIGNED_IN" && session) {
                setIsAuthenticated(true);
                router.replace("/(tabs)/dreams");
            } else if (event === "SIGNED_OUT") {
                setIsAuthenticated(false);
                router.replace("/(auth)");
            }
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const checkAuthState = async () => {
        try {
            const { user } = await getCurrentUser();

            if (user) {
                setIsAuthenticated(true);
                // Don't navigate here, let the initial route handle it
            } else {
                setIsAuthenticated(false);
                // Don't navigate here, let the initial route handle it
            }
        } catch (error) {
            console.error("Error checking auth state:", error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1C1917" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FEFEFE",
    },
});
