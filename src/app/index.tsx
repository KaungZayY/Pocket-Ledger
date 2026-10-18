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
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "react-native";

import { getBooks } from "@/repositories/bookRepository";
import { getTransactionsByBook } from "@/repositories/transactionRepository";
import { calculateBalance } from "@/utils/balance";
import type { Book } from "@/types/book";
import { getBankById } from "@/constants/banks";

type BookSummary = {
  book: Book;
  balance: number;
  transactionCount: number;
};

function formatAmount(amount: number): string {
  return (amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function HomeScreen() {
  const router = useRouter();

  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);

      const savedBooks = await getBooks();

      const summaries = await Promise.all(
        savedBooks.map(async (book) => {
          const transactions = await getTransactionsByBook(book.id);

          return {
            book,
            balance: calculateBalance(transactions),
            transactionCount: transactions.length,
          };
        }),
      );

      setBooks(summaries);
    } catch (error) {
      console.error("Failed to load books:", error);
      Alert.alert("Error", "Could not load your books.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBooks();
    }, [loadBooks]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR FINANCES</Text>
          <Text style={styles.title}>My Books</Text>
        </View>

        <Text style={styles.bookCount}>
          {books.length} {books.length === 1 ? "book" : "books"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.book.id)}
          contentContainerStyle={
            books.length === 0 ? styles.emptyList : styles.list
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const bank = getBankById(item.book.bankId);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.bookCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push(`/books/${item.book.id}` as never)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.bookIcon}>
                    <Text style={styles.bookIconText}>▤</Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </View>

                <Text style={styles.bookName} numberOfLines={1}>
                  {item.book.name}
                </Text>
                {bank && (
                  <View style={styles.bankRow}>
                    <Image
                      source={bank.logo}
                      style={styles.bankLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.bankName}>{bank.name}</Text>
                  </View>
                )}

                <Text style={styles.balanceLabel}>Current balance</Text>

                <Text style={styles.balance}>{formatAmount(item.balance)}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.transactionCount}>
                    {item.transactionCount}{" "}
                    {item.transactionCount === 1
                      ? "transaction"
                      : "transactions"}
                  </Text>
                  <Text style={styles.openLabel}>View book →</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>▤</Text>
              </View>

              <Text style={styles.emptyTitle}>No books yet</Text>

              <Text style={styles.emptyDescription}>
                Create your first book to start recording your bank
                transactions.
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push("/books/create")}
      >
        <Text style={styles.createButtonText}>＋ New Book</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#172033",
  },
  bookCount: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 20,
    gap: 14,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8ECF3",
  },
  pressed: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bookIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bookIconText: {
    fontSize: 25,
    color: "#3159C7",
  },
  chevron: {
    fontSize: 28,
    color: "#94A3B8",
  },
  bookName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },
  balance: {
    fontSize: 28,
    fontWeight: "800",
    color: "#172033",
    fontVariant: ["tabular-nums"],
  },
  cardFooter: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionCount: {
    color: "#64748B",
    fontSize: 12,
  },
  openLabel: {
    color: "#3159C7",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 38,
    color: "#3159C7",
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: "#3159C7",
    paddingVertical: 17,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -6,
    marginBottom: 14,
  },
  bankLogo: {
    width: 28,
    height: 28,
  },
  bankName: {
    color: "#6B7280",
    fontSize: 13,
  },
});
