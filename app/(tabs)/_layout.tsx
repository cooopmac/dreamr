import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/navbar";

export default function TabLayout() {
    return (
        <SafeAreaView
            edges={["top"]}
            style={{ flex: 1, backgroundColor: "#1C1917" }}
        >
            <Tabs
                tabBar={(props) => <Navbar {...props} />}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tabs.Screen
                    name="dreams"
                    options={{
                        title: "Dreams",
                        tabBarAccessibilityLabel: "Dreams Tab",
                    }}
                />
                <Tabs.Screen
                    name="record"
                    options={{
                        title: "Record",
                        tabBarAccessibilityLabel: "Record Dream Tab",
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarAccessibilityLabel: "Profile Tab",
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}

// Alternative usage with HOC pattern:
// export default function TabLayout() {
//     return (
//         <SafeAreaView
//             edges={["top"]}
//             style={{ flex: 1, backgroundColor: "#1C1917" }}
//         >
//             <EnhancedTabs
//                 tabBar={(props) => <Navbar {...props} />}
//                 screenOptions={{
//                     headerShown: false,
//                 }}
//             >
//                 <Tabs.Screen name="home" options={{ title: "Home" }} />
//                 <Tabs.Screen name="dreams" options={{ title: "Dreams" }} />
//             </EnhancedTabs>
//         </SafeAreaView>
//     );
// }
