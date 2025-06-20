import { ResizeMode, Video } from "expo-av";
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

    const handleCTAPress = () => {
        router.push("/(tabs)/home");
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
                        Speak your dreams into reality
                    </Animated.Text>

                    <Animated.View
                        style={[styles.taglineContainer, animatedStyle]}
                    >
                        <Text style={styles.tagline}>
                            Transform thoughts into words,{"\n"}words into
                            dreams,{"\n"}dreams into reality.
                        </Text>
                    </Animated.View>
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <Animated.View style={[styles.ctaContainer, animatedStyle]}>
                        <Pressable
                            onPress={handleCTAPress}
                            style={({ pressed }) => [
                                styles.ctaButton,
                                pressed && styles.ctaButtonPressed,
                            ]}
                        >
                            {({ pressed }) => (
                                <Text
                                    style={[
                                        styles.ctaText,
                                        pressed && styles.ctaTextPressed,
                                    ]}
                                >
                                    Ready to begin your journey?
                                </Text>
                            )}
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
        fontFamily: "Borel-Regular",
        fontSize: 52,
        color: "#FFFCF5",
        textAlign: "center",
        marginBottom: -10,
        letterSpacing: 1,
        textShadowColor: "rgba(0, 0, 0, 0.7)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontFamily: "PPNeueMontreal-Medium",
        fontSize: 20,
        color: "#F5F5F4",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: 0.5,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    taglineContainer: {
        marginBottom: 10,
    },
    tagline: {
        fontFamily: "PPNeueMontreal-Book",
        fontSize: 17,
        color: "#E7E5E4",
        textAlign: "center",
        lineHeight: 20,
        letterSpacing: 0.3,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bottomSection: {
        paddingBottom: 50,
        paddingHorizontal: 32,
    },
    ctaContainer: {
        alignItems: "center",
    },
    ctaButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    ctaButtonPressed: {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        transform: [{ scale: 0.98 }],
    },
    ctaText: {
        fontFamily: "PPNeueMontreal-Italic",
        fontSize: 15,
        color: "#D6D3D1",
        textAlign: "center",
        letterSpacing: 0.5,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    ctaTextPressed: {
        color: "#FFFCF5",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowRadius: 5,
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
