import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VoiceRecorder from "../../utils/voiceRecording";

// Constants
const NAVBAR_HEIGHT = 100; // Adjust based on your navbar
const VIDEO_GENERATION_TIME = 6000; // 6 seconds
const PLACEHOLDER_VIDEO = require("../../assets/videos/video_4.mp4");

// Animated components
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Sub-components
const EmptyState = memo(() => (
    <Animated.View
        entering={FadeIn.duration(800).delay(200)}
        style={styles.emptyState}
    >
        <Ionicons name="videocam-outline" size={64} color="#8B8B8B" />
        <Text style={styles.emptyStateText}>
            Record your dream to see its visual representation
        </Text>
    </Animated.View>
));

const LoadingIndicator = memo(({ isVisible }: { isVisible: boolean }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 2000, easing: Easing.linear }),
                -1
            );
        }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    if (!isVisible) return null;

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.loadingOverlay}
        >
            <View style={styles.loadingContainer}>
                <Animated.View style={animatedStyle}>
                    <Ionicons name="film" size={32} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.loadingText}>
                    Creating your dream visualization...
                </Text>
            </View>
        </Animated.View>
    );
});

const VideoPlayer = memo(
    ({ uri, description }: { uri: any; description: string }) => (
        <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.videoContainer}
        >
            <Video
                source={uri}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={false}
            />

            {/* Gradient overlays */}
            <LinearGradient
                colors={["rgba(28, 25, 23, 0.1)", "rgba(28, 25, 23, 0.2)"]}
                style={styles.videoGradientTop}
                pointerEvents="none"
            />
            <LinearGradient
                colors={["transparent", "rgba(28, 25, 23, 0.8)"]}
                style={styles.videoGradientBottom}
                pointerEvents="none"
            />

            {/* Video info */}
            <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>Your Dream Visualization</Text>
                <Text style={styles.videoDescription} numberOfLines={2}>
                    "{description.substring(0, 100)}
                    {description.length > 100 ? "..." : ""}"
                </Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.insightsButton,
                        pressed && styles.insightsButtonPressed,
                    ]}
                >
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <Text style={styles.insightsButtonText}>
                        View Dream Insights
                    </Text>
                </Pressable>
            </View>
        </Animated.View>
    )
);

const RecordButton = memo(
    ({
        isRecording,
        isDisabled,
        onPress,
    }: {
        isRecording: boolean;
        isDisabled: boolean;
        onPress: () => void;
    }) => {
        const scale = useSharedValue(1);
        const pulseScale = useSharedValue(1);

        useEffect(() => {
            if (isRecording) {
                pulseScale.value = withRepeat(
                    withSpring(1.2, { damping: 2 }),
                    -1,
                    true
                );
            } else {
                pulseScale.value = withSpring(1);
            }
        }, [isRecording]);

        const handlePress = () => {
            scale.value = withSpring(0.9, {}, () => {
                scale.value = withSpring(1);
            });
            onPress();
        };

        const buttonStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
        }));

        const pulseStyle = useAnimatedStyle(() => ({
            transform: [{ scale: pulseScale.value }],
            opacity: isRecording ? 0.3 : 0,
        }));

        return (
            <Pressable onPress={handlePress} disabled={isDisabled}>
                <Animated.View
                    style={[styles.recordButtonContainer, buttonStyle]}
                >
                    {isRecording && (
                        <Animated.View
                            style={[styles.recordButtonPulse, pulseStyle]}
                        />
                    )}
                    <View
                        style={[
                            styles.recordButton,
                            isRecording && styles.recordButtonActive,
                            isDisabled && styles.buttonDisabled,
                        ]}
                    >
                        <Ionicons
                            name={isRecording ? "stop" : "mic"}
                            size={20}
                            color={isRecording ? "#EF4444" : "#FFFFFF"}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        );
    }
);

// Main component
export default function Record() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUri, setVideoUri] = useState<any>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [chatInputHeight, setChatInputHeight] = useState(56); // Default minimum height

    const insets = useSafeAreaInsets();

    // Keyboard event listeners
    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            }
        );

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    // Handlers
    const handleRecordPress = useCallback(async () => {
        console.log("🎯 Record button pressed, isRecording:", isRecording);

        if (!isRecording) {
            // Reset state for new recording
            setVideoUri(null);
            console.log("🧹 Clearing previous transcription...");
            setTranscribedText("");

            // Small delay to ensure UI updates and text clearing completes before starting recording
            setTimeout(() => {
                console.log("▶️ Starting recording...");
                setIsRecording(true);
            }, 150);
        } else {
            console.log("⏹️ Stopping recording...");
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleTranscriptionUpdate = useCallback((text: string) => {
        console.log("📝 Transcription update received:", text);
        setTranscribedText(text);
    }, []);

    const generateVideo = useCallback(async () => {
        if (!transcribedText.trim() || isGenerating) return;

        setIsGenerating(true);
        Keyboard.dismiss();

        try {
            // TODO: Replace with actual API call
            await new Promise((resolve) =>
                setTimeout(resolve, VIDEO_GENERATION_TIME)
            );
            setVideoUri(PLACEHOLDER_VIDEO);
        } catch (error) {
            console.error("Video generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [transcribedText, isGenerating]);

    const handleRecordingComplete = useCallback(
        (recording: boolean) => {
            if (!recording && transcribedText.trim()) {
                generateVideo();
            }
        },
        [transcribedText, generateVideo]
    );

    const handleSendPress = useCallback(() => {
        Keyboard.dismiss();
        generateVideo();
    }, [generateVideo]);

    // Calculate bottom position for chat input
    const chatBottomPosition =
        Math.max(insets.bottom, 16) +
        NAVBAR_HEIGHT +
        (keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0);

    // Calculate dynamic padding for main content based on actual chat input height
    const mainContentPaddingBottom = chatBottomPosition + chatInputHeight + 16; // actual chat height + extra spacing

    return (
        <View style={styles.container}>
            {/* Voice Recorder (hidden component) */}
            <VoiceRecorder
                isRecording={isRecording}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                onRecordingStateChange={handleRecordingComplete}
            />

            {/* Background gradient */}
            <LinearGradient
                colors={["#1C1917", "#1A1715", "#1C1917"]}
                style={styles.backgroundGradient}
            />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {/* Main content area */}
                        <View
                            style={[
                                styles.mainContent,
                                { paddingBottom: mainContentPaddingBottom },
                            ]}
                        >
                            {videoUri ? (
                                <VideoPlayer
                                    uri={videoUri}
                                    description={transcribedText}
                                />
                            ) : (
                                <EmptyState />
                            )}

                            <LoadingIndicator isVisible={isGenerating} />
                        </View>
                    </View>
                </TouchableWithoutFeedback>

                {/* Chat input */}
                <Animated.View
                    entering={FadeIn.delay(400)}
                    style={[
                        styles.chatInputWrapper,
                        { bottom: chatBottomPosition },
                    ]}
                >
                    <View
                        style={styles.chatInputContainer}
                        onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            setChatInputHeight(height);
                        }}
                    >
                        <ScrollView
                            style={styles.textInputScrollView}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <TextInput
                                style={styles.textInput}
                                placeholder={
                                    isRecording
                                        ? "Listening to your dream..."
                                        : "Describe your dream or tap to record..."
                                }
                                placeholderTextColor="#8B8B8B"
                                value={transcribedText}
                                onChangeText={setTranscribedText}
                                multiline
                                maxLength={1000}
                                editable={!isRecording && !isGenerating}
                                returnKeyType="done"
                                blurOnSubmit={true}
                                onSubmitEditing={Keyboard.dismiss}
                            />
                        </ScrollView>

                        <View style={styles.chatActions}>
                            <RecordButton
                                isRecording={isRecording}
                                isDisabled={isGenerating}
                                onPress={handleRecordPress}
                            />

                            <Pressable
                                onPress={handleSendPress}
                                disabled={
                                    !transcribedText.trim() || isGenerating
                                }
                                style={({ pressed }) => [
                                    styles.sendButton,
                                    (!transcribedText.trim() || isGenerating) &&
                                        styles.sendButtonDisabled,
                                    pressed && styles.buttonPressed,
                                ]}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={20}
                                    color={
                                        !transcribedText.trim() || isGenerating
                                            ? "#6B6B6B"
                                            : "#FFFFFF"
                                    }
                                />
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

// Design tokens
const colors = {
    background: "#1C1917",
    backgroundSecondary: "#1A1715",
    surface: "rgba(255, 255, 255, 0.08)",
    surfaceHover: "rgba(255, 255, 255, 0.12)",
    border: "rgba(255, 255, 255, 0.12)",
    borderHover: "rgba(255, 255, 255, 0.2)",
    text: "#FFFCF5",
    textSecondary: "#E7E5E4",
    textPlaceholder: "#8B8B8B",
    accent: "#EF4444",
    accentSurface: "rgba(239, 68, 68, 0.15)",
    disabled: "rgba(255, 255, 255, 0.05)",
};

const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

const borderRadius = {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
};

const typography = {
    title: {
        fontFamily: "Outfit-Bold",
        fontSize: 20,
        lineHeight: 28,
        letterSpacing: 0.3,
    },
    body: {
        fontFamily: "Outfit-Regular",
        fontSize: 16,
        lineHeight: 22,
    },
    caption: {
        fontFamily: "Outfit-Medium",
        fontSize: 13,
        lineHeight: 18,
        letterSpacing: 0.2,
    },
};

const shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xxl,
    },
    emptyStateText: {
        ...typography.body,
        color: colors.textPlaceholder,
        textAlign: "center",
        marginTop: spacing.md,
        paddingHorizontal: spacing.lg,
    },

    // Video Player
    videoContainer: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        overflow: "hidden",
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
        ...shadows.lg,
    },
    video: {
        width: "100%",
        height: "100%",
    },
    videoGradientTop: {
        ...StyleSheet.absoluteFillObject,
    },
    videoGradientBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 160,
    },
    videoInfo: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
    },
    videoTitle: {
        ...typography.title,
        color: colors.text,
        marginBottom: spacing.xs,
        textShadowColor: "rgba(0, 0, 0, 0.9)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    videoDescription: {
        ...typography.body,
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textShadowColor: "rgba(0, 0, 0, 0.9)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // Insights Button
    insightsButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.25)",
        alignSelf: "flex-start",
    },
    insightsButtonPressed: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        transform: [{ scale: 0.98 }],
    },
    insightsButtonText: {
        ...typography.caption,
        color: colors.text,
        marginLeft: spacing.xs + 3,
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Loading
    loadingOverlay: {
        position: "absolute",
        bottom: spacing.xxl,
        left: spacing.md,
        right: spacing.md,
        alignItems: "center",
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.md,
    },
    loadingText: {
        ...typography.body,
        fontSize: 15,
        color: colors.text,
        marginLeft: spacing.sm + 4,
    },

    // Chat Input
    chatInputWrapper: {
        position: "absolute",
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
    },
    chatInputContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 10,
        flexDirection: "row",
        alignItems: "flex-end",
        minHeight: 56,
        maxHeight: 120,
        ...shadows.md,
    },
    textInputScrollView: {
        flex: 1,
        maxHeight: 96,
    },
    textInput: {
        ...typography.body,
        color: colors.text,
        paddingVertical: spacing.xs,
        minHeight: 24,
    },
    chatActions: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: spacing.sm + 4,
        gap: spacing.sm,
    },

    // Buttons
    recordButtonContainer: {
        position: "relative",
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    recordButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        ...shadows.sm,
    },
    recordButtonActive: {
        backgroundColor: colors.accentSurface,
        borderColor: "rgba(239, 68, 68, 0.3)",
    },
    recordButtonPulse: {
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.accent,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        ...shadows.sm,
    },
    sendButtonDisabled: {
        backgroundColor: colors.disabled,
        borderColor: "rgba(255, 255, 255, 0.08)",
        shadowOpacity: 0,
    },
    buttonPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
