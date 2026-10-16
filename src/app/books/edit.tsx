import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import {
  deleteBook,
  getBookById,
  updateBook,
} from "@/repositories/bookRepository";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function EditBookScreen() {
  const params = useLocalSearchParams<{ bookId?: string }>();
  const bookId = Number(getParam(params.bookId));

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadBook() {
        setLoading(true);

        try {
          if (!Number.isInteger(bookId) || bookId <= 0) {
            Alert.alert("Error", "Invalid book.");
            router.back();
            return;
          }

          const book = await getBookById(bookId);

          if (!active) return;

          if (!book) {
            Alert.alert("Not found", "This book no longer exists.");
            router.replace("/");
            return;
          }

          setName(book.name);
        } catch {
          if (active) {
            Alert.alert("Error", "Could not load the book.");
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadBook();

      return () => {
        active = false;
      };
    }, [bookId]),
  );

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Required", "Enter a book name.");
      return;
    }

    setSaving(true);

    try {
      await updateBook(bookId, trimmedName);
      router.back();
    } catch {
      Alert.alert("Error", "Could not update the book.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete book?",
      "This permanently deletes the book and all its transactions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);

            try {
              await deleteBook(bookId);
              router.replace("/");
            } catch {
              Alert.alert("Error", "Could not delete the book.");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading book...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Book</Text>

        <Text style={styles.label}>Book name</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter book name"
          maxLength={100}
          editable={!saving}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.deleteButton, saving && styles.disabledButton]}
          onPress={confirmDelete}
          disabled={saving}
        >
          <Text style={styles.buttonText}>Delete Book</Text>
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
    flex: 1,
    padding: 20,
    gap: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
