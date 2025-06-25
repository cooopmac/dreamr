import Voice from "@react-native-voice/voice";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

interface VoiceRecorderProps {
    onTranscriptionUpdate: (text: string) => void;
    onRecordingStateChange: (isRecording: boolean) => void;
    isRecording: boolean;
}

export default function VoiceRecorder({
    onTranscriptionUpdate,
    onRecordingStateChange,
    isRecording,
}: VoiceRecorderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string>("");
    const finalTranscription = useRef("");

    useEffect(() => {
        // Initialize Voice
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

        // Check if voice recognition is available
        Voice.isAvailable().then((available) => {
            if (available) {
                setIsInitialized(true);
            } else {
                Alert.alert(
                    "Speech Recognition Unavailable",
                    "Speech recognition is not available on this device."
                );
            }
        });

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const onSpeechStart = (e: any) => {
        console.log("🎤 Speech recognition started", e);
        setError("");
        finalTranscription.current = "";
    };

    const onSpeechEnd = (e: any) => {
        console.log("🛑 Speech recognition ended", e);
    };

    const onSpeechError = (e: any) => {
        console.error("❌ Speech recognition error:", e);
        setError(e.error?.message || "Speech recognition error");
        onRecordingStateChange(false);

        // Show user-friendly error
        if (e.error?.code === "no_speech") {
            Alert.alert("No Speech Detected", "Please try speaking again.");
        } else if (e.error?.code === "permission_denied") {
            Alert.alert(
                "Microphone Permission Required",
                "Please allow microphone access in your device settings."
            );
        }
    };

    const onSpeechResults = (e: any) => {
        // Final results when speech ends
        console.log("🎯 Speech results received:", e);
        if (e.value && e.value[0]) {
            const finalText = e.value[0];
            finalTranscription.current = finalText;
            onTranscriptionUpdate(finalText);
            console.log("✅ Final transcription:", finalText);
        }
    };

    const onSpeechPartialResults = (e: any) => {
        // Real-time transcription as user speaks
        console.log("🔄 Partial results received:", e);
        if (e.value && e.value[0]) {
            const partialText = e.value[0];
            console.log("🔄 Partial transcription:", partialText);
            onTranscriptionUpdate(partialText);
        }
    };

    const onSpeechVolumeChanged = (e: any) => {
        // You can use this to show a volume indicator
        // console.log('Volume:', e.value);
    };

    const cleanupVoiceRecognition = async () => {
        try {
            // Force stop any existing recognition
            await Voice.stop();
            await Voice.cancel();
            // Small delay to ensure cleanup
            await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
            // Ignore cleanup errors
            console.log("Voice cleanup completed");
        }
    };

    const startRecording = async () => {
        try {
            // Clear previous transcription
            finalTranscription.current = "";
            setError("");

            // Ensure voice recognition is completely stopped before starting
            console.log("🧹 Cleaning up any existing voice recognition...");
            await cleanupVoiceRecognition();

            // Don't clear transcription here - let the parent component handle it
            // onTranscriptionUpdate("");

            // Start voice recognition with simple language parameter
            await Voice.start("en-US");

            onRecordingStateChange(true);
            console.log("🎙️ Voice recognition started successfully");
        } catch (error) {
            console.error("Failed to start recording:", error);
            onRecordingStateChange(false);
            Alert.alert(
                "Recording Error",
                "Failed to start voice recording. Please check microphone permissions."
            );
        }
    };

    const stopRecording = async () => {
        try {
            const isRecording = await Voice.isRecognizing();
            if (isRecording) {
                await Voice.stop();
                // Note: Voice.stop() doesn't always trigger onSpeechEnd immediately
                // The final results will come through onSpeechResults
            }
            onRecordingStateChange(false);
            console.log("⏹️ Voice recognition stopped");
        } catch (error) {
            console.error("Failed to stop recording:", error);
            onRecordingStateChange(false);
        }
    };

    // Handle recording toggle
    useEffect(() => {
        if (!isInitialized) return;

        if (isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    }, [isRecording, isInitialized]);

    // Optional: You can expose the error state if you want to show it in the UI
    return null;
}

// Export types for external use
export type { VoiceRecorderProps };
