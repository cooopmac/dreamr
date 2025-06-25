import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Higher-order component for navbar
export function withNavbar<T extends object>(
    WrappedComponent: React.ComponentType<T>
): React.ComponentType<T> {
    return (props: T) => {
        return (
            <View style={styles.container}>
                <WrappedComponent {...props} />
            </View>
        );
    };
}

// Custom navbar component
const Navbar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const getIconName = (routeName: string, focused: boolean) => {
        switch (routeName) {
            case "dreams":
                return focused ? "moon" : "moon-outline";
            case "record":
                return "add"; // Always use add icon for record
            case "profile":
                return focused ? "person" : "person-outline";
            default:
                return "circle-outline";
        }
    };

    // Sort routes to ensure proper order: dreams, record, profile
    const sortedRoutes = [...state.routes].sort((a, b) => {
        const order = { dreams: 0, record: 1, profile: 2 };
        return (
            (order[a.name as keyof typeof order] || 999) -
            (order[b.name as keyof typeof order] || 999)
        );
    });

    // Separate the routes
    const dreamsRoute = sortedRoutes.find((route) => route.name === "dreams");
    const recordRoute = sortedRoutes.find((route) => route.name === "record");
    const profileRoute = sortedRoutes.find((route) => route.name === "profile");

    const renderTabButton = (route: any, isCenter = false) => {
        if (!route) return null;

        const { options } = descriptors[route.key];
        const label =
            options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

        const isFocused =
            state.index === state.routes.findIndex((r) => r.key === route.key);
        const isRecordTab = route.name === "record";

        const onPress = () => {
            const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
            }
        };

        const onLongPress = () => {
            navigation.emit({
                type: "tabLongPress",
                target: route.key,
            });
        };

        // Special rendering for record tab (center button)
        if (isRecordTab) {
            return (
                <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={
                        options.tabBarAccessibilityLabel || "Record Dream"
                    }
                    testID={options.tabBarButtonTestID}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={styles.recordButton}
                >
                    <View style={styles.recordButtonInner}>
                        <Ionicons name="add" size={32} color="#000000" />
                    </View>
                </TouchableOpacity>
            );
        }

        // Smaller side tab rendering
        return (
            <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.sideNavItem}
            >
                <View
                    style={[
                        styles.sideIconContainer,
                        isFocused && styles.sideIconContainerFocused,
                    ]}
                >
                    <Ionicons
                        name={getIconName(route.name, isFocused) as any}
                        size={20}
                        color={isFocused ? "#FFFFFF" : "#8B8B8B"}
                    />
                </View>
                {isFocused && (
                    <Text style={styles.sideLabel}>
                        {typeof label === "string" ? label : route.name}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.navbar}>
            <View style={styles.navbarContent}>
                {/* Left side tab */}
                <View style={styles.sideContainer}>
                    {renderTabButton(dreamsRoute)}
                </View>

                {/* Center record button */}
                <View style={styles.centerContainer}>
                    {renderTabButton(recordRoute, true)}
                </View>

                {/* Right side tab */}
                <View style={styles.sideContainer}>
                    {renderTabButton(profileRoute)}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navbar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#000000",
        paddingBottom: 34, // Safe area padding for iPhone
        paddingTop: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: "#333333",
    },
    navbarContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 70,
    },
    sideContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    centerContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    sideNavItem: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
    },
    sideIconContainer: {
        padding: 6,
        borderRadius: 16,
        minWidth: 40,
        minHeight: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    sideIconContainerFocused: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    sideLabel: {
        color: "#FFFFFF",
        fontSize: 10,
        marginTop: 2,
        fontFamily: "Outfit-Medium",
    },
    recordButton: {
        alignItems: "center",
        justifyContent: "center",
    },
    recordButtonInner: {
        backgroundColor: "#FFFFFF",
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        borderWidth: 4,
        borderColor: "#000000",
    },
    // Legacy styles (keeping for backward compatibility)
    navItem: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 20,
    },
    iconContainerFocused: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    label: {
        color: "#FFFFFF",
        fontSize: 12,
        marginTop: 4,
        fontFamily: "Outfit-Medium",
    },
});

export default Navbar;
