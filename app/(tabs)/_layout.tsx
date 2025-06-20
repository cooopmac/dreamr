import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/navbar";

export default function TabLayout() {
    return (
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
            <Tabs
                tabBar={(props) => <Navbar {...props} />}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: "none" },
                }}
            >
                <Tabs.Screen name="home" options={{ title: "home" }} />
                <Tabs.Screen name="dreams" options={{ title: "dreams" }} />
            </Tabs>
        </SafeAreaView>
    );
}
