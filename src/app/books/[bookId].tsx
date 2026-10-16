import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { getBookById } from "@/repositories/bookRepository";
import { getTransactionsByBook } from "@/repositories/transactionRepository";
import { calculateBalance } from "@/utils/balance";
import { groupTransactionsByDate } from "@/utils/transactionGrouping";
import { BANKS } from "@/constants/banks";
import { Book } from "@/types/book";
import { Transaction } from "@/types/transaction";

function formatAmount(amount: number): string {
  return (Math.abs(amount) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: string): string {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSignedAmount(amount: number): string {
  if (amount > 0) return `+${formatAmount(amount)}`;
  if (amount < 0) return `-${formatAmount(amount)}`;
  return formatAmount(0);
}

function getSignedAmount(transaction: Transaction): number {
  return transaction.direction === "+"
    ? transaction.amount
    : -transaction.amount;
}

export default function BookDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId: string }>();
  const bookId = Number(params.bookId);

  const [book, setBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      setBook(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [savedBook, savedTransactions] = await Promise.all([
        getBookById(bookId),
        getTransactionsByBook(bookId),
      ]);

      setBook(savedBook);
      setTransactions(savedTransactions);
    } catch (error) {
      console.error("Failed to load book:", error);
      Alert.alert("Error", "Could not load this book.");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  function confirmDeleteBook() {
    if (!book) return;

    Alert.alert(
      "Delete book?",
      `Delete "${book.name}" and all its transactions? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            router.push({
              pathname: "/books/edit",
              params: { bookId: String(book.id), deleteAfterEdit: "true" },
            });
          },
        },
      ],
    );
  }

  const balance = calculateBalance(transactions);
  const groups = groupTransactionsByDate(transactions);

  return (
    <>
      <Stack.Screen
        options={{
          title: book?.name ?? "Book Details",
          headerBackTitle: "Books",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F5F7FB" },
          headerTintColor: "#172033",
          headerRight: () =>
            book ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/books/edit",
                    params: { bookId: String(book.id) },
                  })
                }
                hitSlop={10}
              >
                <Text style={styles.headerAction}>Edit</Text>
              </Pressable>
            ) : null,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3159C7" />
        </View>
      ) : !book ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Book not found</Text>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.link}>Return to My Books</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <Text style={styles.balanceValue}>{formatSignedAmount(balance)}</Text>
            <Text style={styles.balanceCaption}>
              {transactions.length}{" "}
              {transactions.length === 1 ? "transaction" : "transactions"}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.sectionSubtitle}>Newest first</Text>
          </View>

          <FlatList
            data={groups}
            keyExtractor={(item) => item.date}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              groups.length === 0 ? styles.emptyList : styles.list
            }
            renderItem={({ item }) => (
              <View style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{formatDate(item.date)}</Text>
                  <Text
                    style={[
                      styles.dayNet,
                      item.netAmount >= 0
                        ? styles.creditText
                        : styles.debitText,
                    ]}
                  >
                    {formatSignedAmount(item.netAmount)}
                  </Text>
                </View>

                {item.transactions.map((transaction) => {
                  const bank = BANKS.find(
                    (candidate) => candidate.id === transaction.bankId,
                  );

                  const signedAmount = getSignedAmount(transaction);

                  return (
                    <Pressable
                      key={transaction.id}
                      style={({ pressed }) => [
                        styles.transactionRow,
                        pressed && styles.pressed,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/books/transaction-details",
                          params: {
                            bookId: String(book.id),
                            transactionId: String(transaction.id),
                          },
                        })
                      }
                    >
                      <View style={styles.bankIcon}>
                        <Text style={styles.bankIconText}>
                          {bank?.name.charAt(0) ?? "B"}
                        </Text>
                      </View>

                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionName} numberOfLines={1}>
                          {transaction.name}
                        </Text>
                        <Text style={styles.bankName} numberOfLines={1}>
                          {bank?.name ?? transaction.bankId}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.transactionAmount,
                          signedAmount >= 0
                            ? styles.creditText
                            : styles.debitText,
                        ]}
                      >
                        {formatSignedAmount(signedAmount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyDescription}>
                  Add your first credit or debit to start your bank book.
                </Text>
              </View>
            }
          />

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/books/transaction",
                params: { bookId: String(book.id) },
              })
            }
          >
            <Text style={styles.addButtonText}>＋ Add Transaction</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  balanceCard: {
    backgroundColor: "#203F91",
    borderRadius: 20,
    padding: 24,
    marginTop: 12,
    marginBottom: 26,
  },
  balanceLabel: {
    color: "#D8E2FF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 10,
    fontVariant: ["tabular-nums"],
  },
  balanceCaption: {
    color: "#D8E2FF",
    fontSize: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#64748B",
    fontSize: 12,
  },
  list: {
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  dayGroup: {
    marginBottom: 22,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  dayNet: {
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8ECF3",
  },
  pressed: {
    opacity: 0.75,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bankIconText: {
    color: "#3159C7",
    fontSize: 16,
    fontWeight: "800",
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionName: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "700",
  },
  bankName: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  creditText: {
    color: "#15803D",
  },
  debitText: {
    color: "#DC2626",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  link: {
    color: "#3159C7",
    fontWeight: "700",
  },
  headerAction: {
    color: "#3159C7",
    fontWeight: "700",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#3159C7",
    borderRadius: 15,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
