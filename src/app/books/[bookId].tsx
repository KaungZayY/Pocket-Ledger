import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { getBookById } from "@/repositories/bookRepository";
import {
  getBookSummary,
  getDayStatement,
  type BookSummary,
  type DayStatement,
} from "@/repositories/statementRepository";
import { getBankById } from "@/constants/banks";
import {
  addDays,
  clampDateKey,
  fromDateKey,
  toDateKey,
} from "@/utils/date";
import { Book } from "@/types/book";

/* ---------- formatting ---------- */

function formatAmount(amount: number): string {
  return (Math.abs(amount) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBalance(amount: number): string {
  return `${amount < 0 ? "-" : ""}${formatAmount(amount)}`;
}

function formatSignedAmount(amount: number): string {
  if (amount > 0) return `+${formatAmount(amount)}`;
  if (amount < 0) return `-${formatAmount(amount)}`;
  return formatAmount(0);
}

function formatDate(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId: string }>();
  const bookId = Number(params.bookId);

  const todayKey = toDateKey(new Date());

  const [book, setBook] = useState<Book | null>(null);
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [statement, setStatement] = useState<DayStatement | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = today
  const [loading, setLoading] = useState(true);
  const [tableWidth, setTableWidth] = useState(0);

  const activeDate = selectedDate ?? todayKey;

  // Selectable range: first transaction -> today (or a later future-dated entry).
  const minDate = summary?.firstDate ?? todayKey;
  const maxDate =
    summary?.lastDate && summary.lastDate > todayKey
      ? summary.lastDate
      : todayKey;

  useFocusEffect(
    useCallback(() => {
      if (!Number.isSafeInteger(bookId) || bookId <= 0) {
        setBook(null);
        setLoading(false);
        return;
      }

      // Guards against an older response overwriting a newer one
      // when the user changes dates quickly.
      let cancelled = false;

      (async () => {
        try {
          const [savedBook, savedSummary] = await Promise.all([
            getBookById(bookId),
            getBookSummary(bookId),
          ]);

          const min = savedSummary.firstDate ?? todayKey;
          const max =
            savedSummary.lastDate && savedSummary.lastDate > todayKey
              ? savedSummary.lastDate
              : todayKey;

          // An edit may have moved the first/last date; keep selection in range.
          const date = clampDateKey(activeDate, min, max);
          const savedStatement = await getDayStatement(bookId, date);

          if (cancelled) return;

          setBook(savedBook);
          setSummary(savedSummary);
          setStatement(savedStatement);
          if (date !== activeDate) setSelectedDate(date);
        } catch (error) {
          console.error("Failed to load book:", error);
          if (!cancelled) Alert.alert("Error", "Could not load this book.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [bookId, activeDate, todayKey]),
  );

  function selectDate(key: string) {
    setSelectedDate(clampDateKey(key, minDate, maxDate));
  }

  // onValueChange only fires when a date is actually chosen,
  // so there is no event.type check any more (dismissals go to onDismiss).
  function onPickerValueChange(_event: DateTimePickerEvent, date: Date) {
    selectDate(toDateKey(date));
  }

  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: fromDateKey(activeDate),
      mode: "date",
      minimumDate: fromDateKey(minDate),
      maximumDate: fromDateKey(maxDate),
      onValueChange: onPickerValueChange,
    });
  }

  const canGoBack = activeDate > minDate;
  const canGoForward = activeDate < maxDate;
  const isToday = activeDate === todayKey;

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

      {loading && !statement ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3159C7" />
        </View>
      ) : !book || !summary || !statement ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Book not found</Text>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.link}>Return to My Books</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* All-time balance */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current balance</Text>
              <Text style={styles.balanceValue}>
                {formatBalance(summary.balance)}
              </Text>
              <Text style={styles.balanceCaption}>
                {summary.count}{" "}
                {summary.count === 1 ? "transaction" : "transactions"} in total
              </Text>
            </View>

            {/* Date bar */}
            <View style={styles.dateBar}>
              <Pressable
                onPress={() => selectDate(addDays(activeDate, -1))}
                disabled={!canGoBack}
                hitSlop={8}
                style={[styles.navButton, !canGoBack && styles.navDisabled]}
              >
                <Text style={styles.navText}>‹</Text>
              </Pressable>

              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={fromDateKey(activeDate)}
                  mode="date"
                  display="compact"
                  minimumDate={fromDateKey(minDate)}
                  maximumDate={fromDateKey(maxDate)}
                  onValueChange={onPickerValueChange}
                />
              ) : (
                <Pressable onPress={openAndroidPicker} style={styles.dateLabel}>
                  <Text style={styles.dateLabelText}>
                    {formatDate(activeDate)}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => selectDate(addDays(activeDate, 1))}
                disabled={!canGoForward}
                hitSlop={8}
                style={[styles.navButton, !canGoForward && styles.navDisabled]}
              >
                <Text style={styles.navText}>›</Text>
              </Pressable>

              {!isToday && (
                <Pressable
                  onPress={() => setSelectedDate(null)}
                  style={styles.todayChip}
                >
                  <Text style={styles.todayChipText}>Today</Text>
                </Pressable>
              )}
            </View>

            {/* Day summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <SummaryItem
                  label="Opening balance"
                  value={formatBalance(statement.opening)}
                />
                <SummaryItem
                  label="Closing balance"
                  value={formatBalance(statement.closing)}
                  align="right"
                />
              </View>
              <View style={styles.summaryRow}>
                <SummaryItem
                  label="Total credit"
                  value={`+${formatAmount(statement.credits)}`}
                  tone="credit"
                />
                <SummaryItem
                  label="Total debit"
                  value={`-${formatAmount(statement.debits)}`}
                  tone="debit"
                  align="right"
                />
              </View>
            </View>

            {/* Table */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction history</Text>
              <Text style={styles.sectionSubtitle}>
                {statement.rows.length}{" "}
                {statement.rows.length === 1 ? "transaction" : "transactions"}
              </Text>
            </View>

            {statement.rows.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No transactions on this date</Text>
                <Text style={styles.emptyDescription}>
                  The balance carries over unchanged from the previous day.
                </Text>
              </View>
            ) : (
              <View
                style={styles.tableWrap}
                onLayout={(e) => setTableWidth(e.nativeEvent.layout.width)}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={{ width: Math.max(tableWidth, MIN_TABLE_W) }}>
                    <View style={[styles.tr, styles.thead]}>
                      <Text style={[styles.th, styles.colName]}>Transaction</Text>
                      <Text style={[styles.th, styles.colNum]}>Before</Text>
                      <Text style={[styles.th, styles.colNum]}>Amount</Text>
                      <Text style={[styles.th, styles.colNum]}>After</Text>
                    </View>

                    {statement.rows.map((row, index) => {
                      const { transaction } = row;
                      const bank = getBankById(transaction.bankId);

                      return (
                        <Pressable
                          key={transaction.id}
                          onPress={() =>
                            router.push({
                              pathname: "/books/transaction-details",
                              params: {
                                bookId: String(book.id),
                                transactionId: String(transaction.id),
                              },
                            })
                          }
                          style={({ pressed }) => [
                            styles.tr,
                            index % 2 === 1 && styles.trAlt,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={[styles.colName, styles.nameCell]}>
                            {bank ? (
                              <Image source={bank.logo} style={styles.bankLogo} />
                            ) : (
                              <View style={[styles.bankLogo, styles.bankFallback]}>
                                <Text style={styles.bankFallbackText}>
                                  {transaction.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.nameText}>
                              <Text style={styles.txName} numberOfLines={1}>
                                {transaction.name}
                              </Text>
                              <Text style={styles.txBank} numberOfLines={1}>
                                {bank?.name ?? "No bank"}
                              </Text>
                            </View>
                          </View>

                          <Text style={[styles.td, styles.colNum, styles.muted]}>
                            {formatBalance(row.before)}
                          </Text>
                          <View style={styles.colNum}>
                            <Text
                              style={[
                                styles.td,
                                styles.bold,
                                styles.right,
                                row.signedAmount >= 0
                                  ? styles.creditText
                                  : styles.debitText,
                              ]}
                            >
                              {formatSignedAmount(row.signedAmount)}
                            </Text>
                            <Text
                              style={[
                                styles.directionLabel,
                                row.signedAmount >= 0
                                  ? styles.creditText
                                  : styles.debitText,
                              ]}
                            >
                              {row.signedAmount >= 0 ? "Credit" : "Debit"}
                            </Text>
                          </View>
                          <Text style={[styles.td, styles.colNum, styles.bold]}>
                            {formatBalance(row.after)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: "/books/transaction",
                params: { bookId: String(book.id), date: activeDate },
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

function SummaryItem({
  label,
  value,
  tone,
  align = "left",
}: {
  label: string;
  value: string;
  tone?: "credit" | "debit";
  align?: "left" | "right";
}) {
  return (
    <View style={[styles.summaryItem, align === "right" && styles.alignEnd]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          tone === "credit" && styles.creditText,
          tone === "debit" && styles.debitText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* ---------- styles ---------- */

const NUM_W = 76;
const MIN_TABLE_W = 330;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB", paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 12 },
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
    marginBottom: 18,
  },
  balanceLabel: { color: "#D8E2FF", fontSize: 13, fontWeight: "600" },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  balanceCaption: { color: "#D8E2FF", fontSize: 12, marginTop: 8 },

  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  navDisabled: { opacity: 0.35 },
  navText: { color: "#3159C7", fontSize: 22, fontWeight: "700", marginTop: -2 },
  dateLabel: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  dateLabelText: { color: "#172033", fontSize: 14, fontWeight: "700" },
  todayChip: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#3159C7",
    alignItems: "center",
    justifyContent: "center",
  },
  todayChipText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    gap: 16,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItem: { flex: 1 },
  alignEnd: { alignItems: "flex-end" },
  summaryLabel: { color: "#64748B", fontSize: 12 },
  summaryValue: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { color: "#172033", fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: "#64748B", fontSize: 12 },

  // Table: no borders, structure comes from background shading only.
  tableWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  trAlt: { backgroundColor: "#F8FAFE" },
  thead: { backgroundColor: "#EEF2FA", paddingVertical: 10 },
  th: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  td: { fontSize: 12, fontVariant: ["tabular-nums"], color: "#172033" },
  right: { textAlign: "right" },
  directionLabel: { fontSize: 10, fontWeight: "600", textAlign: "right", marginTop: 2 },
  colName: { flex: 1, minWidth: 96 },
  colNum: { width: NUM_W, textAlign: "right" },
  muted: { color: "#64748B" },
  bold: { fontWeight: "800" },
  nameCell: { flexDirection: "row", alignItems: "center" },
  nameText: { flex: 1, marginLeft: 8 },
  txName: { color: "#172033", fontSize: 13, fontWeight: "700" },
  txBank: { color: "#64748B", fontSize: 11, marginTop: 2 },
  bankLogo: { width: 26, height: 26, borderRadius: 8 },
  bankFallback: {
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bankFallbackText: { color: "#3159C7", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75 },

  creditText: { color: "#15803D" },
  debitText: { color: "#DC2626" },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  emptyTitle: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  link: { color: "#3159C7", fontWeight: "700" },
  headerAction: { color: "#3159C7", fontWeight: "700", fontSize: 15 },

  addButton: {
    backgroundColor: "#3159C7",
    borderRadius: 15,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});