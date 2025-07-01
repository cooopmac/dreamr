import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser, signOut } from "../../utils/userAuth";

export default function Profile() {
    const [userName, setUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const { user } = await getCurrentUser();
            if (user) {
                // Get name from user metadata or email
                const name =
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "User";
                setUserName(name);
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    setLoggingOut(true);
                    try {
                        const result = await signOut();
                        if (result.success) {
                            router.replace("/(auth)");
                        } else {
                            Alert.alert(
                                "Error",
                                "Failed to sign out. Please try again."
                            );
                        }
                    } catch (error) {
                        Alert.alert("Error", "An unexpected error occurred.");
                    } finally {
                        setLoggingOut(false);
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Subtle gradient background */}
            <LinearGradient
                colors={["#FEFEFE", "#F9F9F9", "#FEFEFE"]}
                style={styles.backgroundGradient}
            />

            <SafeAreaView style={styles.contentContainer}>
                <View style={styles.content}>
                    <Text style={styles.title}>profile</Text>

                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color="#1C1917"
                            style={styles.loader}
                        />
                    ) : (
                        <View style={styles.userSection}>
                            <View style={styles.welcomeContainer}>
                                <Text style={styles.welcomeText}>
                                    Welcome back,
                                </Text>
                                <Text style={styles.userName}>{userName}</Text>
                            </View>

                            <Pressable
                                onPress={handleLogout}
                                disabled={loggingOut}
                                style={({ pressed }) => [
                                    styles.logoutButton,
                                    pressed && styles.logoutButtonPressed,
                                    loggingOut && styles.logoutButtonDisabled,
                                ]}
                            >
                                <LinearGradient
                                    colors={["#DC2626", "#B91C1C"]}
                                    style={styles.logoutGradient}
                                />
                                {loggingOut ? (
                                    <ActivityIndicator
                                        color="#FFFFFF"
                                        size="small"
                                    />
                                ) : (
                                    <Text style={styles.logoutButtonText}>
                                        Sign Out
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FEFEFE",
    },
    backgroundGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 32,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 120, // Add padding for navbar
    },
    title: {
        fontFamily: "Outfit-Bold",
        fontSize: 36,
        color: "#1C1917",
        textAlign: "center",
        letterSpacing: -1,
        textShadowColor: "rgba(255, 255, 255, 0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        marginBottom: 40,
    },
    loader: {
        marginTop: 20,
    },
    userSection: {
        alignItems: "center",
        width: "100%",
    },
    welcomeContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    welcomeText: {
        fontFamily: "Outfit-Medium",
        fontSize: 18,
        color: "#6B7280",
        textAlign: "center",
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    userName: {
        fontFamily: "Outfit-Bold",
        fontSize: 24,
        color: "#1C1917",
        textAlign: "center",
        letterSpacing: -0.5,
    },
    logoutButton: {
        borderRadius: 16,
        overflow: "hidden",
        width: "100%",
        maxWidth: 280,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#DC2626",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoutButtonPressed: {
        transform: [{ scale: 0.98 }],
        shadowOpacity: 0.1,
    },
    logoutButtonDisabled: {
        opacity: 0.6,
    },
    logoutGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    logoutButtonText: {
        fontFamily: "Outfit-Bold",
        fontSize: 16,
        color: "#FFFFFF",
        letterSpacing: -0.3,
    },
});
