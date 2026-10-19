import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

type ContactItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  url: string;
};

const CONTACTS: ContactItem[] = [
  {
    icon: "mail-outline",
    label: "Email",
    value: "kaungzayyan19@gmail.com",
    url: "mailto:kaungzayyan19@gmail.com",
  },
  //   {
  //     icon: "call-outline",
  //     label: "Phone",
  //     value: "+95 9 123 456 789",
  //     url: "tel:+959123456789",
  //   },
  {
    icon: "logo-github",
    label: "GitHub",
    value: "github.com/KaungZayY",
    url: "https://github.com/KaungZayY",
  },
];

export default function InfoScreen() {
  const APP_NAME = Constants.expoConfig?.name ?? "Pocket Ledger";
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const APP_DESCRIPTION =
    "Keep a simple record of the money moving through your bank accounts and wallets.";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.version}>Version {version}</Text>
        <Text style={styles.description}>{APP_DESCRIPTION}</Text>
      </View>

      <Text style={styles.sectionTitle}>Contact</Text>

      <View style={styles.card}>
        {CONTACTS.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => Linking.openURL(item.url)}
            style={({ pressed }) => [
              styles.row,
              index % 2 === 1 && styles.rowAlt,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color="#3159C7" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { padding: 20, paddingBottom: 40 },

  hero: {
    backgroundColor: "#203F91",
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  appName: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  version: { color: "#D8E2FF", fontSize: 12, marginTop: 6 },
  description: {
    color: "#D8E2FF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },

  sectionTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  rowAlt: { backgroundColor: "#F8FAFE" },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowText: { flex: 1 },
  rowLabel: { color: "#64748B", fontSize: 12 },
  rowValue: { color: "#172033", fontSize: 15, fontWeight: "700", marginTop: 2 },
});
