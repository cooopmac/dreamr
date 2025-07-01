import { useFocusEffect } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signIn } from "../../utils/userAuth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const videoRef = useRef<Video>(null);

    useFocusEffect(
        useCallback(() => {
            // Ensure video plays when screen comes into focus
            if (videoRef.current) {
                videoRef.current.playAsync();
            }
        }, [])
    );

    const handleLogin = async () => {
        if (loading) return;

        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        setLoading(true);

        try {
            const result = await signIn(email.trim(), password);

            if (result.success) {
                router.push("/(tabs)/dreams");
            } else {
                Alert.alert("Login Failed", result.error || "Please try again");
            }
        } catch (error) {
            Alert.alert(
                "Error",
                "An unexpected error occurred. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const navigateToSignup = () => {
        router.push("/(auth)/signup");
    };

    const navigateBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* Full Screen Video Background */}
            <Video
                source={require("../../assets/videos/video_2.mp4")}
                style={styles.backgroundVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                ref={videoRef}
            />

            {/* Simple Dark Overlay */}
            <LinearGradient
                colors={["rgba(28, 25, 23, 0.2)", "rgba(28, 25, 23, 0.4)"]}
                style={styles.overlay}
            />

            {/* Edge Blur Effects */}
            {/* Top blur */}
            <LinearGradient
                colors={[
                    "rgba(28, 25, 23, 0.9)",
                    "rgba(28, 25, 23, 0.7)",
                    "rgba(28, 25, 23, 0.4)",
                    "rgba(28, 25, 23, 0.2)",
                    "rgba(28, 25, 23, 0.05)",
                    "transparent",
                ]}
                style={styles.topBlur}
            />
            {/* Bottom blur */}
            <LinearGradient
                colors={[
                    "transparent",
                    "rgba(28, 25, 23, 0.05)",
                    "rgba(28, 25, 23, 0.2)",
                    "rgba(28, 25, 23, 0.4)",
                    "rgba(28, 25, 23, 0.7)",
                    "rgba(28, 25, 23, 0.9)",
                ]}
                style={styles.bottomBlur}
            />
            {/* Left blur */}
            <LinearGradient
                colors={[
                    "rgba(28, 25, 23, 0.8)",
                    "rgba(28, 25, 23, 0.5)",
                    "rgba(28, 25, 23, 0.2)",
                    "rgba(28, 25, 23, 0.05)",
                    "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.leftBlur}
            />
            {/* Right blur */}
            <LinearGradient
                colors={[
                    "transparent",
                    "rgba(28, 25, 23, 0.05)",
                    "rgba(28, 25, 23, 0.2)",
                    "rgba(28, 25, 23, 0.5)",
                    "rgba(28, 25, 23, 0.8)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.rightBlur}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardContainer}
            >
                <SafeAreaView style={styles.safeArea}>
                    {/* Back Button */}
                    <View style={styles.backButtonContainer}>
                        <Pressable
                            onPress={navigateBack}
                            style={({ pressed }) => [
                                styles.backButton,
                                pressed && styles.backButtonPressed,
                            ]}
                        >
                            <BlurView
                                intensity={20}
                                style={styles.backButtonBlur}
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(255, 252, 245, 0.1)",
                                        "rgba(255, 252, 245, 0.05)",
                                    ]}
                                    style={styles.backButtonGradient}
                                />
                                <Text style={styles.backButtonText}>←</Text>
                            </BlurView>
                        </Pressable>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                    >
                        {/* Header Section */}
                        <View style={styles.headerSection}>
                            <Text style={styles.title}>dreamr.</Text>
                            <Text style={styles.subtitle}>
                                welcome back to your dreams
                            </Text>
                        </View>

                        {/* Glass Form Container */}
                        <View style={styles.glassContainer}>
                            <LinearGradient
                                colors={[
                                    "rgba(255, 252, 245, 0.1)",
                                    "rgba(255, 252, 245, 0.05)",
                                ]}
                                style={styles.glassGradient}
                            />

                            <View style={styles.formContent}>
                                {/* Email Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <View
                                        style={styles.inputWrapper}
                                        pointerEvents="box-none"
                                    >
                                        <TextInput
                                            style={styles.textInput}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="Enter your email"
                                            placeholderTextColor="#FFFFFF"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            autoCorrect={false}
                                            spellCheck={false}
                                            textContentType="emailAddress"
                                            returnKeyType="next"
                                            clearButtonMode="while-editing"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        Password
                                    </Text>
                                    <View
                                        style={styles.inputWrapper}
                                        pointerEvents="box-none"
                                    >
                                        <TextInput
                                            style={styles.textInput}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Enter your password"
                                            placeholderTextColor="#FFFFFF"
                                            secureTextEntry
                                            autoComplete="password"
                                            autoCorrect={false}
                                            spellCheck={false}
                                            textContentType="password"
                                            returnKeyType="done"
                                            clearButtonMode="while-editing"
                                        />
                                    </View>
                                </View>

                                {/* Forgot Password */}
                                <Pressable style={styles.forgotContainer}>
                                    <Text style={styles.forgotText}>
                                        Forgot your password?
                                    </Text>
                                </Pressable>

                                {/* Login Button */}
                                <Pressable
                                    onPress={handleLogin}
                                    disabled={loading}
                                    style={({ pressed }) => [
                                        styles.loginButton,
                                        pressed && styles.loginButtonPressed,
                                        loading && styles.loginButtonDisabled,
                                    ]}
                                >
                                    <BlurView
                                        intensity={25}
                                        style={styles.buttonBlur}
                                    >
                                        <LinearGradient
                                            colors={[
                                                "rgba(255, 252, 245, 0.2)",
                                                "rgba(255, 252, 245, 0.1)",
                                            ]}
                                            style={styles.buttonGradient}
                                        />
                                        <View style={styles.buttonContent}>
                                            {loading && (
                                                <ActivityIndicator
                                                    color="#FFFCF5"
                                                    size="small"
                                                    style={styles.buttonSpinner}
                                                />
                                            )}
                                            <Text
                                                style={styles.loginButtonText}
                                            >
                                                Sign In
                                            </Text>
                                        </View>
                                    </BlurView>
                                </Pressable>
                            </View>
                        </View>

                        {/* Sign Up Link */}
                        <View style={styles.signupSection}>
                            <Text style={styles.signupPrompt}>
                                New to dreamr?
                            </Text>
                            <Pressable
                                onPress={navigateToSignup}
                                style={({ pressed }) => [
                                    styles.signupLink,
                                    pressed && styles.signupLinkPressed,
                                ]}
                            >
                                <Text style={styles.signupText}>
                                    Create an account.
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1C1917",
    },
    backgroundVideo: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    topBlur: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 160,
    },
    bottomBlur: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 160,
    },
    leftBlur: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 120,
    },
    rightBlur: {
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        width: 120,
    },
    keyboardContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 32,
    },
    backButtonContainer: {
        paddingTop: 8,
        paddingBottom: 16,
        alignItems: "flex-start",
    },
    backButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    backButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    backButtonBlur: {
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 252, 245, 0.15)",
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    backButtonText: {
        fontFamily: "Outfit-Bold",
        fontSize: 20,
        color: "#FFFCF5",
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingVertical: 10,
    },
    headerSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontFamily: "Outfit-Bold",
        fontSize: 42,
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: -1,
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: "Outfit-Medium",
        fontSize: 14,
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: -0.3,
        textShadowColor: "rgba(0, 0, 0, 0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        opacity: 0.9,
    },
    glassContainer: {
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 252, 245, 0.1)",
        backgroundColor: "rgba(255, 252, 245, 0.05)",
        marginBottom: 16,
    },
    glassGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    formContent: {
        padding: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: "Outfit-Bold",
        fontSize: 13,
        color: "#FFFCF5",
        marginBottom: 6,
        letterSpacing: -0.3,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    inputWrapper: {
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 252, 245, 0.2)",
        backgroundColor: "rgba(255, 252, 245, 0.08)",
    },
    textInput: {
        fontFamily: "Outfit-Medium",
        fontSize: 15,
        color: "#FFFCF5",
        padding: 14,
        backgroundColor: "transparent",
        letterSpacing: -0.3,
        borderWidth: 0,
    },
    forgotContainer: {
        alignSelf: "flex-end",
        marginBottom: 20,
    },
    forgotText: {
        fontFamily: "Outfit-Medium",
        fontSize: 14,
        color: "#A8A29E",
        letterSpacing: -0.2,
        mixBlendMode: "difference",
    },
    loginButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    loginButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    loginButtonDisabled: {
        opacity: 0.5,
    },
    buttonBlur: {
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 252, 245, 0.2)",
    },
    buttonGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonSpinner: {
        marginRight: 8,
    },
    loginButtonText: {
        fontFamily: "Outfit-Bold",
        fontSize: 16,
        color: "#FFFCF5",
        textAlign: "center",
        padding: 18,
        letterSpacing: -0.3,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    signupSection: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
    },
    signupPrompt: {
        fontFamily: "Outfit-Medium",
        fontSize: 14,
        color: "#A8A29E",
        letterSpacing: -0.2,
    },
    signupLink: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    signupLinkPressed: {
        opacity: 0.7,
    },
    signupText: {
        fontFamily: "Outfit-Bold",
        fontSize: 14,
        color: "#FFFCF5",
        letterSpacing: -0.2,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        mixBlendMode: "difference",
    },
});
