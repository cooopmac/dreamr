import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)/index" />
            <Stack.Protected guard={true}>
                <Stack.Screen name="(tabs)" />
            </Stack.Protected>
        </Stack>
    );
}
