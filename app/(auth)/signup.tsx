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
import { signUp } from "../../utils/userAuth";

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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

    const handleSignup = async () => {
        if (loading) return;

        // Validation
        if (!name.trim()) {
            Alert.alert("Error", "Please enter your full name");
            return;
        }

        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email address");
            return;
        }

        if (!password.trim()) {
            Alert.alert("Error", "Please enter a password");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            const result = await signUp(email.trim(), password, name.trim());

            if (result.success) {
                if (result.data?.user && !result.data?.session) {
                    // Email confirmation required
                    Alert.alert(
                        "Check Your Email",
                        "We've sent you a confirmation email. Please check your inbox and click the confirmation link to complete your account setup.",
                        [
                            {
                                text: "OK",
                                onPress: () => router.push("/(auth)/login"),
                            },
                        ]
                    );
                } else {
                    // User is signed in immediately
                    router.push("/(tabs)/dreams");
                }
            } else {
                Alert.alert(
                    "Signup Failed",
                    result.error || "Please try again"
                );
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

    const navigateToLogin = () => {
        router.push("/(auth)/login");
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
                                begin turning your dreams into reality.
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
                                {/* Name Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        Full Name
                                    </Text>
                                    <View
                                        style={styles.inputWrapper}
                                        pointerEvents="box-none"
                                    >
                                        <TextInput
                                            style={styles.textInput}
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="Enter your full name"
                                            placeholderTextColor="#FFFFFF"
                                            autoCapitalize="words"
                                            autoComplete="name"
                                            autoCorrect={false}
                                            spellCheck={false}
                                            textContentType="name"
                                            returnKeyType="next"
                                            clearButtonMode="while-editing"
                                        />
                                    </View>
                                </View>

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
                                            placeholder="Create a password"
                                            placeholderTextColor="#FFFFFF"
                                            secureTextEntry
                                            autoComplete="password-new"
                                            autoCorrect={false}
                                            spellCheck={false}
                                            textContentType="newPassword"
                                            returnKeyType="next"
                                            clearButtonMode="while-editing"
                                        />
                                    </View>
                                </View>

                                {/* Confirm Password Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>
                                        Confirm Password
                                    </Text>
                                    <View
                                        style={styles.inputWrapper}
                                        pointerEvents="box-none"
                                    >
                                        <TextInput
                                            style={styles.textInput}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="Confirm your password"
                                            placeholderTextColor="#FFFFFF"
                                            secureTextEntry
                                            autoComplete="password-new"
                                            autoCorrect={false}
                                            spellCheck={false}
                                            textContentType="newPassword"
                                            returnKeyType="done"
                                            clearButtonMode="while-editing"
                                        />
                                    </View>
                                </View>

                                {/* Terms Notice */}
                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our
                                    Terms of Service and Privacy Policy
                                </Text>

                                {/* Signup Button */}
                                <Pressable
                                    onPress={handleSignup}
                                    disabled={loading}
                                    style={({ pressed }) => [
                                        styles.signupButton,
                                        pressed && styles.signupButtonPressed,
                                        loading && styles.signupButtonDisabled,
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
                                                style={styles.signupButtonText}
                                            >
                                                Create Account
                                            </Text>
                                        </View>
                                    </BlurView>
                                </Pressable>
                            </View>
                        </View>

                        {/* Login Link */}
                        <View style={styles.loginSection}>
                            <Text style={styles.loginPrompt}>
                                Already have an account?
                            </Text>
                            <Pressable
                                onPress={navigateToLogin}
                                style={({ pressed }) => [
                                    styles.loginLink,
                                    pressed && styles.loginLinkPressed,
                                ]}
                            >
                                <Text style={styles.loginText}>Sign In</Text>
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
    termsText: {
        fontFamily: "Outfit-Medium",
        fontSize: 11,
        color: "#A8A29E",
        textAlign: "center",
        lineHeight: 16,
        marginTop: 4,
        marginBottom: 20,
        letterSpacing: -0.2,
        opacity: 0.8,
    },
    signupButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    signupButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    signupButtonDisabled: {
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
    signupButtonText: {
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
    loginSection: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
    },
    loginPrompt: {
        fontFamily: "Outfit-Medium",
        fontSize: 14,
        color: "#A8A29E",
        letterSpacing: -0.2,
        mixBlendMode: "difference",
    },
    loginLink: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    loginLinkPressed: {
        opacity: 0.7,
    },
    loginText: {
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
