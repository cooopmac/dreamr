import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import {
    EnhancementProgress,
    EnhancementStatus,
} from "../utils/dreamEnhancementService";

interface DreamEnhancementProgressProps {
    progress: EnhancementProgress;
    visible: boolean;
}

export default function DreamEnhancementProgress({
    progress,
    visible,
}: DreamEnhancementProgressProps) {
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(visible ? 1 : 0);
    const scale = useSharedValue(visible ? 1 : 0.8);

    // Animation for loading spinner
    useEffect(() => {
        if (progress.status === EnhancementStatus.ENHANCING) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 2000, easing: Easing.linear }),
                -1,
                false
            );
        } else {
            rotation.value = withTiming(0, { duration: 300 });
        }
    }, [progress.status]);

    // Animation for component visibility
    useEffect(() => {
        opacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
        scale.value = withTiming(visible ? 1 : 0.8, { duration: 300 });
    }, [visible]);

    const rotationStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    if (!visible) return null;

    const getIcon = () => {
        switch (progress.status) {
            case EnhancementStatus.ENHANCING:
                return (
                    <Animated.View style={rotationStyle}>
                        <Ionicons name="sparkles" size={24} color="#F59E0B" />
                    </Animated.View>
                );
            case EnhancementStatus.COMPLETED:
                return (
                    <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#10B981"
                    />
                );
            case EnhancementStatus.ERROR:
                return (
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                );
            default:
                return <Ionicons name="sparkles" size={24} color="#6B7280" />;
        }
    };

    const getGradientColors = (): [string, string] => {
        switch (progress.status) {
            case EnhancementStatus.ENHANCING:
                return ["rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0.05)"];
            case EnhancementStatus.COMPLETED:
                return ["rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.05)"];
            case EnhancementStatus.ERROR:
                return ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0.05)"];
            default:
                return [
                    "rgba(107, 114, 128, 0.15)",
                    "rgba(107, 114, 128, 0.05)",
                ];
        }
    };

    const getBorderColor = () => {
        switch (progress.status) {
            case EnhancementStatus.ENHANCING:
                return "rgba(245, 158, 11, 0.3)";
            case EnhancementStatus.COMPLETED:
                return "rgba(16, 185, 129, 0.3)";
            case EnhancementStatus.ERROR:
                return "rgba(239, 68, 68, 0.3)";
            default:
                return "rgba(107, 114, 128, 0.3)";
        }
    };

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={[styles.card, { borderColor: getBorderColor() }]}>
                <LinearGradient
                    colors={getGradientColors()}
                    style={styles.gradient}
                />

                <View style={styles.content}>
                    <View style={styles.iconContainer}>{getIcon()}</View>

                    <View style={styles.textContainer}>
                        <Text style={styles.message}>{progress.message}</Text>

                        {/* Progress bar for enhancing state */}
                        {progress.status === EnhancementStatus.ENHANCING &&
                            progress.progress && (
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBarBackground}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${progress.progress}%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {Math.round(progress.progress)}%
                                    </Text>
                                </View>
                            )}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        paddingHorizontal: 16,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    iconContainer: {
        marginRight: 12,
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    textContainer: {
        flex: 1,
    },
    message: {
        fontFamily: "Outfit-Medium",
        fontSize: 14,
        color: "#FFFFFF",
        marginBottom: 4,
        letterSpacing: -0.2,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    progressBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    progressBarBackground: {
        flex: 1,
        height: 4,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 2,
        overflow: "hidden",
        marginRight: 8,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#F59E0B",
        borderRadius: 2,
    },
    progressText: {
        fontFamily: "Outfit-Bold",
        fontSize: 12,
        color: "#F59E0B",
        minWidth: 35,
        textAlign: "right",
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
