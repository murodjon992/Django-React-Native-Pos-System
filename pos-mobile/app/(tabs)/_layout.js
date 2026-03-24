import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>

      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <Ionicons name="barcode" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: "Ombor",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="refund"
        options={{
          title: "Refund",
          tabBarIcon: ({ color }) => (
            <Ionicons name="return-down-back" size={22} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}