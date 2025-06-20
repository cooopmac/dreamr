import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Icon mapping for tabs
const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: "home",
    dreams: "moon",
};

// Higher Order Component Navbar
const withNavbar = (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
        return (
            <View style={styles.container}>
                <WrappedComponent {...props} />
            </View>
        );
    };
};

// Main Navbar Component
export default function Navbar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    return (
        <View style={styles.navbar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    typeof options.tabBarLabel === "string"
                        ? options.tabBarLabel
                        : options.title ?? route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                const iconName = tabIcons[route.name] || "help-circle";

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tab}
                    >
                        <Ionicons
                            name={iconName}
                            size={24}
                            color={isFocused ? "#007AFF" : "#8E8E93"}
                        />
                        <Text
                            style={[
                                styles.tabLabel,
                                { color: isFocused ? "#007AFF" : "#8E8E93" },
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navbar: {
        flexDirection: "row",
        backgroundColor: "#000",
        paddingBottom: 20,
        paddingTop: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: "500",
    },
});
