import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { BANKS } from "@/constants/banks";
import {
  createTransaction,
  getTransactionById,
  updateTransaction,
} from "@/repositories/transactionRepository";
import type { TransactionDirection } from "@/types/transaction";
import { getBookById } from "@/repositories/bookRepository";
import BankSelector from "@/components/BankSelector";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAmount(amount: number) {
  return (amount / 100).toFixed(2);
}

export default function TransactionScreen() {
  const params = useLocalSearchParams<{
    bookId?: string;
    transactionId?: string;
  }>();

  const bookId = Number(getParam(params.bookId));
  const transactionIdParam = getParam(params.transactionId);
  const transactionId = transactionIdParam ? Number(transactionIdParam) : null;

  const isEditing = transactionId !== null;

  const [name, setName] = useState("");
  const [bankId, setBankId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<TransactionDirection>("+");
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadForm() {
      setLoading(true);

      try {
        if (!Number.isInteger(bookId) || bookId <= 0) {
          Alert.alert("Error", "Invalid book.");
          router.back();
          return;
        }

        if (isEditing && transactionId !== null) {
          // Editing: use the transaction's saved bank.
          const transaction = await getTransactionById(transactionId);

          if (!active) return;

          if (!transaction || transaction.bookId !== bookId) {
            Alert.alert("Not found", "This transaction could not be found.");
            router.back();
            return;
          }

          setName(transaction.name);
          setBankId(transaction.bankId);
          setAmount(formatAmount(transaction.amount));
          setDirection(transaction.direction);
          setDate(transaction.transactionDate.slice(0, 10));
        } else {
          // Creating: use the book's default bank, if one exists.
          const book = await getBookById(bookId);

          if (!active) return;

          if (!book) {
            Alert.alert("Not found", "This book could not be found.");
            router.back();
            return;
          }

          setName("");
          setBankId(book.bankId ?? null);
          setAmount("");
          setDirection("+");
          setDate(getToday());
        }
      } catch {
        if (active) {
          Alert.alert("Error", "Could not load the transaction form.");
          router.back();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadForm();

    return () => {
      active = false;
    };
  }, [bookId, isEditing, transactionId]);

  async function handleSave() {
    if (!Number.isInteger(bookId) || bookId <= 0) {
      Alert.alert("Error", "Invalid book.");
      return;
    }

    if (isEditing && (!transactionId || !Number.isInteger(transactionId))) {
      Alert.alert("Error", "Invalid transaction.");
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Required", "Enter a transaction name.");
      return;
    }

    const amountMatch = amount.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);

    if (!amountMatch) {
      Alert.alert(
        "Invalid amount",
        "Enter a positive amount with up to two decimal places.",
      );
      return;
    }

    const wholeAmount = Number(amountMatch[1]);
    const decimalAmount = Number((amountMatch[2] ?? "").padEnd(2, "0"));
    const amountInMinorUnits = wholeAmount * 100 + decimalAmount;

    if (!Number.isSafeInteger(amountInMinorUnits) || amountInMinorUnits <= 0) {
      Alert.alert("Invalid amount", "Enter a valid positive amount.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Invalid date", "Use the date format YYYY-MM-DD.");
      return;
    }

    const parsedDate = new Date(`${date}T12:00:00`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== Number(date.slice(0, 4)) ||
      parsedDate.getMonth() + 1 !== Number(date.slice(5, 7)) ||
      parsedDate.getDate() !== Number(date.slice(8, 10))
    ) {
      Alert.alert("Invalid date", "Enter a real date in YYYY-MM-DD format.");
      return;
    }

    setSaving(true);

    try {
      if (isEditing && transactionId !== null) {
        await updateTransaction(transactionId, {
          name: trimmedName,
          bankId,
          amount: amountInMinorUnits,
          direction,
          transactionDate: `${date}T12:00:00`,
        });
      } else {
        await createTransaction({
          bookId,
          name: trimmedName,
          bankId,
          amount: amountInMinorUnits,
          direction,
          transactionDate: `${date}T12:00:00`,
        });
      }

      router.back();
    } catch {
      Alert.alert(
        "Save failed",
        "Could not save this transaction. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading transaction...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isEditing ? "Edit Transaction" : "Add Transaction"}
      </Text>

      <Text style={styles.label}>Transaction type</Text>
      <View style={styles.directionRow}>
        {(["+", "-"] as const).map((item) => {
          const isCredit = item === "+";
          const selected = direction === item;

          return (
            <Pressable
              key={item}
              onPress={() => setDirection(item)}
              style={[
                styles.directionButton,
                isCredit ? styles.creditButton : styles.debitButton,
                selected &&
                  (isCredit ? styles.creditSelected : styles.debitSelected),
              ]}
            >
              <Text
                style={[
                  styles.directionText,
                  isCredit ? styles.creditText : styles.debitText,
                  selected && styles.directionTextSelected,
                ]}
              >
                {isCredit ? "Credit (+)" : "Debit (-)"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Name / From or To</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Salary or Grocery Store"
        maxLength={150}
      />

      <Text style={styles.label}>Bank</Text>
      <BankSelector selectedBankId={bankId} onSelect={setBankId} />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={(value) => {
          if (/^\d*\.?\d{0,2}$/.test(value)) setAmount(value);
        }}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Transaction date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-10-16"
        autoCapitalize="none"
      />

      <Pressable
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Save Transaction"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  directionRow: {
    flexDirection: "row",
    gap: 10,
  },
  directionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
  },
  creditButton: { borderColor: "#15803D" },
  debitButton: { borderColor: "#DC2626" },
  creditSelected: { backgroundColor: "#15803D" },
  debitSelected: { backgroundColor: "#DC2626" },
  creditText: { color: "#15803D" },
  debitText: { color: "#DC2626" },
  directionText: {
    fontWeight: "600",
  },
  directionTextSelected: {
    color: "#FFFFFF",
  },
  bankList: {
    gap: 8,
  },
  bankOption: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
  },
  bankSelected: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },
  bankText: {
    fontSize: 15,
  },
  bankTextSelected: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  saveButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
