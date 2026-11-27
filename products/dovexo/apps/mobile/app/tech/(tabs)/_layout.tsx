import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tabIconColor } from "@/src/components/ui";
import { useSync } from "@/src/lib/sync";
import { colors, layout, spacing } from "@/src/theme/tokens";

export default function TechTabsLayout() {
  const insets = useSafeAreaInsets();
  const { pending, failed } = useSync();
  const badge = pending + failed;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text2,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: layout.tabBarHeight + insets.bottom,
          paddingTop: spacing[1] + 2,
          paddingBottom: insets.bottom + spacing[1] + 2,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={tabIconColor(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={tabIconColor(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Trabajos",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "construct" : "construct-outline"}
              size={size}
              color={tabIconColor(color)}
            />
          ),
          tabBarBadge: badge > 0 ? badge : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.warning,
            color: colors.textInverse,
            fontSize: 10,
            fontWeight: "700",
          },
          tabBarAccessibilityLabel:
            badge > 0 ? `Trabajos, ${badge} cambios pendientes de sincronizar` : "Trabajos",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={tabIconColor(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}