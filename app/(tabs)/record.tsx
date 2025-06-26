import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VoiceRecorder from "../../utils/voiceRecording";

// Constants
const NAVBAR_HEIGHT = 100;
const VIDEO_GENERATION_TIME = 6000; // 6 seconds
const PLACEHOLDER_VIDEO = require("../../assets/videos/video_4.mp4");

export default function Record() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUri, setVideoUri] = useState<any>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [chatInputHeight, setChatInputHeight] = useState(56);

    const insets = useSafeAreaInsets();

    // Keyboard listeners
    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    // Handle recording
    const handleRecordPress = () => {
        if (!isRecording) {
            setVideoUri(null);
            setTranscribedText("");
            setTimeout(() => setIsRecording(true), 150);
        } else {
            setIsRecording(false);
        }
    };

    const handleTranscriptionUpdate = (text: string) => {
        setTranscribedText(text);
    };

    const handleRecordingComplete = (recording: boolean) => {
        if (!recording && transcribedText.trim()) {
            generateVideo();
        }
    };

    const generateVideo = async () => {
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
    };

    const handleSendPress = () => {
        Keyboard.dismiss();
        generateVideo();
    };

    // Calculate positions
    const chatBottomPosition =
        Math.max(insets.bottom, 16) +
        NAVBAR_HEIGHT +
        (keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0);
    const mainContentPaddingBottom = chatBottomPosition + chatInputHeight + 16;

    // Loading animation
    const rotation = useSharedValue(0);
    useEffect(() => {
        if (isGenerating) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 2000, easing: Easing.linear }),
                -1,
                false
            );
        } else {
            rotation.value = 0;
        }
    }, [isGenerating]);

    const loadingStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <View style={styles.container}>
            {/* Voice Recorder */}
            <VoiceRecorder
                isRecording={isRecording}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                onRecordingStateChange={handleRecordingComplete}
            />

            {/* Background */}
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
                        {/* Main content */}
                        <View
                            style={[
                                styles.mainContent,
                                { paddingBottom: mainContentPaddingBottom },
                            ]}
                        >
                            {videoUri ? (
                                // Video Player
                                <Animated.View
                                    entering={FadeIn.duration(600)}
                                    style={styles.videoContainer}
                                >
                                    <Video
                                        source={videoUri}
                                        style={styles.video}
                                        resizeMode={ResizeMode.COVER}
                                        shouldPlay
                                        isLooping
                                        isMuted={false}
                                    />
                                    <View style={styles.videoInfo}>
                                        <Text style={styles.videoTitle}>
                                            Your Dream Visualization
                                        </Text>
                                        <Text
                                            style={styles.videoDescription}
                                            numberOfLines={2}
                                        >
                                            "{transcribedText.substring(0, 100)}
                                            {transcribedText.length > 100
                                                ? "..."
                                                : ""}
                                            "
                                        </Text>
                                        <Pressable
                                            style={styles.insightsButton}
                                        >
                                            <Ionicons
                                                name="sparkles"
                                                size={16}
                                                color="#FFFFFF"
                                            />
                                            <Text
                                                style={
                                                    styles.insightsButtonText
                                                }
                                            >
                                                View Dream Insights
                                            </Text>
                                        </Pressable>
                                    </View>
                                </Animated.View>
                            ) : (
                                // Empty State
                                <Animated.View
                                    entering={FadeIn.duration(800).delay(200)}
                                    style={styles.emptyState}
                                >
                                    <Ionicons
                                        name="videocam-outline"
                                        size={64}
                                        color="#8B8B8B"
                                    />
                                    <Text style={styles.emptyStateText}>
                                        Record your dream to see its visual
                                        representation
                                    </Text>
                                </Animated.View>
                            )}

                            {/* Loading Indicator */}
                            {isGenerating && (
                                <Animated.View
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                    style={styles.loadingOverlay}
                                >
                                    <View style={styles.loadingContainer}>
                                        <Animated.View style={loadingStyle}>
                                            <Ionicons
                                                name="film"
                                                size={32}
                                                color="#FFFFFF"
                                            />
                                        </Animated.View>
                                        <Text style={styles.loadingText}>
                                            Creating your dream visualization...
                                        </Text>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>

                {/* Chat Input */}
                <Animated.View
                    entering={FadeIn.delay(400)}
                    style={[
                        styles.chatInputWrapper,
                        { bottom: chatBottomPosition },
                    ]}
                >
                    <View
                        style={styles.chatInputContainer}
                        onLayout={(event) =>
                            setChatInputHeight(event.nativeEvent.layout.height)
                        }
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
                            {/* Record Button */}
                            <Pressable
                                onPress={handleRecordPress}
                                disabled={isGenerating}
                                style={({ pressed }) => [
                                    styles.recordButton,
                                    isRecording && styles.recordButtonActive,
                                    pressed && styles.buttonPressed,
                                    isGenerating && styles.buttonDisabled,
                                ]}
                            >
                                <Ionicons
                                    name={isRecording ? "stop" : "mic"}
                                    size={20}
                                    color={isRecording ? "#EF4444" : "#FFFFFF"}
                                />
                            </Pressable>

                            {/* Send Button */}
                            <Pressable
                                onPress={handleSendPress}
                                disabled={
                                    !transcribedText.trim() || isGenerating
                                }
                                style={({ pressed }) => [
                                    styles.sendButton,
                                    pressed && styles.buttonPressed,
                                    (!transcribedText.trim() || isGenerating) &&
                                        styles.sendButtonDisabled,
                                ]}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={20}
                                    color={
                                        transcribedText.trim() && !isGenerating
                                            ? "#FFFFFF"
                                            : "#666666"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1C1917",
    },
    backgroundGradient: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
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
        paddingHorizontal: 32,
    },
    emptyStateText: {
        fontSize: 16,
        lineHeight: 0,
        color: "#8B8B8B",
        textAlign: "center",
        marginTop: 0,
        paddingHorizontal: 24,
        fontFamily: "Outfit-Regular",
        letterSpacing: -0.25,
    },

    // Video Player
    videoContainer: {
        flex: 1,
        backgroundColor: "#1F1F1F",
        borderRadius: 12,
        overflow: "hidden",
        marginHorizontal: 16,
        marginTop: 8,
    },
    video: {
        width: "100%",
        height: "100%",
    },
    videoInfo: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    videoTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#FFFFFF",
        marginBottom: 4,
        textShadowColor: "rgba(0, 0, 0, 0.9)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        fontFamily: "Outfit-SemiBold",
    },
    videoDescription: {
        fontSize: 15,
        color: "#D1D5DB",
        marginBottom: 16,
        textShadowColor: "rgba(0, 0, 0, 0.9)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        fontFamily: "Outfit-Regular",
    },
    insightsButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.25)",
        alignSelf: "flex-start",
    },
    insightsButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#FFFFFF",
        marginLeft: 6,
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        fontFamily: "Outfit-Medium",
    },

    // Loading
    loadingOverlay: {
        position: "absolute",
        top: "7.5%",
        left: 16,
        right: 16,
        alignItems: "center",
        transform: [{ translateY: -25 }],
        zIndex: 10,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#374151",
    },
    loadingText: {
        fontSize: 15,
        color: "#FFFFFF",
        marginLeft: 12,
        fontFamily: "Outfit-Regular",
    },

    // Chat Input
    chatInputWrapper: {
        position: "absolute",
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    chatInputContainer: {
        backgroundColor: "#1F1F1F",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#374151",
        paddingHorizontal: 16,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "flex-end",
        minHeight: 56,
        maxHeight: 120,
    },
    textInputScrollView: {
        flex: 1,
        maxHeight: 96,
    },
    textInput: {
        fontSize: 16,
        color: "#FFFFFF",
        paddingVertical: 8,
        paddingHorizontal: 4,
        minHeight: 24,
        textAlignVertical: "center",
        fontFamily: "Outfit-Regular",
    },
    chatActions: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 12,
        gap: 8,
    },

    // Buttons
    recordButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1F1F1F",
        borderWidth: 1,
        borderColor: "#374151",
        alignItems: "center",
        justifyContent: "center",
    },
    recordButtonActive: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.3)",
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1F1F1F",
        borderWidth: 1,
        borderColor: "#374151",
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled: {
        backgroundColor: "#111111",
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    buttonPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
