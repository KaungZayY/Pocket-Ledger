import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { BANKS } from "@/constants/banks";
import {
  deleteTransaction,
  getTransactionById,
} from "@/repositories/transactionRepository";
import type { Transaction } from "@/types/transaction";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAmount(amount: number) {
  return (amount / 100).toFixed(2);
}

export default function TransactionDetailsScreen() {
  const params = useLocalSearchParams<{
    bookId?: string;
    transactionId?: string;
  }>();

  const bookId = Number(getParam(params.bookId));
  const transactionId = Number(getParam(params.transactionId));

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTransaction = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getTransactionById(transactionId);

      if (!result || result.bookId !== bookId) {
        setTransaction(null);
      } else {
        setTransaction(result);
      }
    } catch {
      Alert.alert("Error", "Could not load the transaction.");
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [bookId, transactionId]);

  useFocusEffect(
    useCallback(() => {
      loadTransaction();
    }, [loadTransaction]),
  );

  function confirmDelete() {
    Alert.alert(
      "Delete transaction?",
      "This transaction will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              router.back();
            } catch {
              Alert.alert("Error", "Could not delete the transaction.");
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading transaction...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text>Transaction not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const bank = BANKS.find((item) => item.id === transaction.bankId);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Transaction Details</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{transaction.name}</Text>

          <Text style={styles.label}>Type</Text>
          <Text
            style={[
              styles.value,
              transaction.direction === "+" ? styles.credit : styles.debit,
            ]}
          >
            {transaction.direction === "+" ? "Credit" : "Debit"}
          </Text>

          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>
            {transaction.direction === "+" ? "+" : "-"}
            {formatAmount(transaction.amount)}
          </Text>

          <Text style={styles.label}>Bank account</Text>
          <Text style={styles.value}>{bank?.name ?? transaction.bankId}</Text>

          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {transaction.transactionDate.slice(0, 10)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.editButton}
          onPress={() =>
            router.push({
              pathname: "/books/transaction",
              params: {
                bookId: String(bookId),
                transactionId: String(transaction.id),
              },
            })
          }
        >
          <Text style={styles.buttonText}>Edit Transaction</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.buttonText}>Delete Transaction</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 6,
  },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    gap: 7,
  },
  label: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 13,
  },
  value: {
    fontSize: 17,
    fontWeight: "600",
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
  },
  credit: {
    color: "#15803D",
  },
  debit: {
    color: "#B91C1C",
  },
  editButton: {
    backgroundColor: "#1D4ED8",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#B91C1C",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  link: {
    color: "#1D4ED8",
    fontWeight: "600",
  },
});
