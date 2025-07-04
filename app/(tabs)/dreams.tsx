import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dreams() {
    return (
        <View style={styles.container}>
            {/* Subtle gradient background */}
            <LinearGradient
                colors={["#1C1917", "#1A1715", "#1C1917"]}
                style={styles.backgroundGradient}
            />

            <SafeAreaView style={styles.contentContainer}>
                <View style={styles.content}>
                    <Text style={styles.title}>dreams</Text>
                    <Text style={styles.subtitle}>
                        your recorded dreams appear here
                    </Text>
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
        color: "#FFFCF5",
        textAlign: "center",
        letterSpacing: -1,
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: "Outfit-Medium",
        fontSize: 16,
        color: "#E7E5E4",
        textAlign: "center",
        letterSpacing: -0.3,
        textShadowColor: "rgba(0, 0, 0, 0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
});
