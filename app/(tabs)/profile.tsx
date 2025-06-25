import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
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
                    <Text style={styles.subtitle}>
                        manage your account and preferences
                    </Text>
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
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: "Outfit-Medium",
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        letterSpacing: -0.3,
    },
});
