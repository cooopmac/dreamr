import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Landing() {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);

    useEffect(() => {
        opacity.value = withDelay(
            500,
            withTiming(1, {
                duration: 1200,
                easing: Easing.out(Easing.cubic),
            })
        );

        translateY.value = withDelay(
            500,
            withTiming(0, {
                duration: 1200,
                easing: Easing.out(Easing.cubic),
            })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const handleLoginPress = () => {
        router.push("/(auth)/login");
    };

    const handleSignupPress = () => {
        router.push("/(auth)/signup");
    };

    return (
        <View style={styles.container}>
            {/* Full Screen Video Background */}
            <Video
                source={require("../../assets/videos/video_4.mp4")}
                style={styles.backgroundVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
            />

            {/* Simple Dark Overlay */}
            <LinearGradient
                colors={["rgba(28, 25, 23, 0.1)", "rgba(28, 25, 23, 0.3)"]}
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

            {/* Content */}
            <SafeAreaView style={styles.contentContainer}>
                <View style={styles.mainContent}>
                    <Animated.Text style={[styles.title, animatedStyle]}>
                        dreamr.
                    </Animated.Text>
                    <Animated.Text style={[styles.subtitle, animatedStyle]}>
                        speak your dreams into reality.
                    </Animated.Text>
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <Animated.View
                        style={[styles.authContainer, animatedStyle]}
                    >
                        {/* Signup Button - Primary */}
                        <Pressable
                            onPress={handleSignupPress}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && styles.primaryButtonPressed,
                            ]}
                        >
                            <BlurView intensity={25} style={styles.buttonBlur}>
                                <LinearGradient
                                    colors={[
                                        "rgba(255, 252, 245, 0.2)",
                                        "rgba(255, 252, 245, 0.1)",
                                    ]}
                                    style={styles.buttonGradient}
                                />
                                <Text style={styles.primaryButtonText}>
                                    Begin Your Journey
                                </Text>
                            </BlurView>
                        </Pressable>

                        {/* Login Button - Secondary */}
                        <Pressable
                            onPress={handleLoginPress}
                            style={({ pressed }) => [
                                styles.secondaryButton,
                                pressed && styles.secondaryButtonPressed,
                            ]}
                        >
                            <BlurView
                                intensity={15}
                                style={styles.secondaryBlur}
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(255, 252, 245, 0.05)",
                                        "rgba(255, 252, 245, 0.02)",
                                    ]}
                                    style={styles.buttonGradient}
                                />
                                <Text style={styles.secondaryButtonText}>
                                    Already have an account? Sign In
                                </Text>
                            </BlurView>
                        </Pressable>
                    </Animated.View>
                </View>
            </SafeAreaView>
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
    contentContainer: {
        flex: 1,
        paddingHorizontal: 32,
    },
    mainContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontFamily: "Outfit-Bold",
        fontSize: 54,
        color: "#FFFCF5",
        textAlign: "center",
        marginTop: 30,
        marginBottom: -5,
        letterSpacing: -1,
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontFamily: "Outfit-Medium",
        fontSize: 20,
        color: "#F5F5F4",
        textAlign: "center",
        letterSpacing: -0.5,
        marginBottom: 5,
        textShadowColor: "rgba(0, 0, 0, 0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    bottomSection: {
        paddingBottom: 50,
    },
    authContainer: {
        gap: 16,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    primaryButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
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
    primaryButtonText: {
        fontFamily: "Outfit-Bold",
        fontSize: 18,
        color: "#FFFCF5",
        textAlign: "center",
        padding: 20,
        letterSpacing: -0.3,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    secondaryButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    secondaryButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    secondaryBlur: {
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 252, 245, 0.1)",
    },
    secondaryButtonText: {
        fontFamily: "Outfit-Medium",
        fontSize: 16,
        color: "#E7E5E4",
        textAlign: "center",
        padding: 18,
        letterSpacing: -0.3,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        opacity: 0.9,
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
});
