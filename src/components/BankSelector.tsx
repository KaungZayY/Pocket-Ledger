import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BANKS } from "../constants/banks";

type BankSelectorProps = {
  selectedBankId: string | null;
  onSelect: (bankId: string | null) => void;
};

export default function BankSelector({
  selectedBankId,
  onSelect,
}: BankSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedBank = BANKS.find((bank) => bank.id === selectedBankId);

  function selectBank(bankId: string | null) {
    onSelect(bankId);
    setOpen(false);
  }

  return (
    <View>
      {/* Dropdown trigger */}
      <Pressable
        style={styles.dropdown}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Default bank: ${selectedBank?.name ?? "No default bank"}`}
      >
        {selectedBank ? (
          <Image
            source={selectedBank.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noBankIcon}>
            <Text style={styles.noBankText}>—</Text>
          </View>
        )}

        <Text style={styles.bankName}>
          {selectedBank?.name ?? "No default bank"}
        </Text>

        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {/* Dropdown options */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={styles.menu}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.menuTitle}>Select default bank</Text>

            <ScrollView
              style={styles.options}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                style={[
                  styles.option,
                  selectedBankId === null && styles.selectedOption,
                ]}
                onPress={() => selectBank(null)}
              >
                <View style={styles.noBankIcon}>
                  <Text style={styles.noBankText}>—</Text>
                </View>

                <Text style={styles.bankName}>No default bank</Text>

                {selectedBankId === null && <Text style={styles.check}>✓</Text>}
              </Pressable>

              {BANKS.map((bank) => {
                const selected = selectedBankId === bank.id;

                return (
                  <Pressable
                    key={bank.id}
                    style={[styles.option, selected && styles.selectedOption]}
                    onPress={() => selectBank(bank.id)}
                  >
                    <Image
                      source={bank.logo}
                      style={styles.logo}
                      resizeMode="contain"
                    />

                    <Text style={styles.bankName}>{bank.name}</Text>

                    {selected && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 36,
    height: 36,
  },
  noBankIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  noBankText: {
    color: "#6B7280",
    fontSize: 20,
  },
  bankName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  chevron: {
    fontSize: 20,
    color: "#6B7280",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  menu: {
    maxHeight: "75%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  options: {
    flexGrow: 0,
  },
  option: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },
  check: {
    color: "#1D4ED8",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
    marginTop: 4,
  },
  cancelText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
});
