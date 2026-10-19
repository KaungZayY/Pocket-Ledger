import { Stack, Link } from "expo-router";
import { useEffect, useState } from "react";
import { getDatabase } from "@/db/database";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    async function initializeDatabase() {
      await getDatabase();
      setDatabaseReady(true);
    }

    initializeDatabase();
  }, []);

  if (!databaseReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Pocket Ledger",
          headerRight: () => (
            <Link href="/info" asChild>
              <Pressable hitSlop={10} accessibilityLabel="About and contact">
                <Ionicons
                  name="information-circle-outline"
                  size={26}
                  color="#3159C7"
                />
              </Pressable>
            </Link>
          ),
        }}
      />

      <Stack.Screen
        name="info"
        options={{
          title: "About",
          headerBackTitle: "Pocket Ledger",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F5F7FB" },
          headerTintColor: "#172033",
        }}
      />
    </Stack>
  );
}
