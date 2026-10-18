
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { createBook } from '@/repositories/bookRepository';
import BankSelector from '@/components/BankSelector';

export default function CreateBookScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [bankId, setBankId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreateBook() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Book name required', 'Please enter a name for your book.');
      return;
    }

    try {
      setSaving(true);

      await createBook(trimmedName, bankId);

      router.back();
    } catch (error) {
      console.error('Failed to create book:', error);
      Alert.alert('Error', 'Could not create the book. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Book',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F5F7FB' },
          headerTintColor: '#172033',
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <Text style={styles.heading}>Create a book</Text>

          <Text style={styles.description}>
            Give your bank book a name so you can easily find it later.
          </Text>

          <Text style={styles.label}>Book name</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Personal Bank"
            placeholderTextColor="#94A3B8"
            maxLength={80}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreateBook}
            editable={!saving}
          />

          <Text style={styles.hint}>
            You can create as many books as you need.
          </Text>

          <Text style={styles.label}>Default bank account (optional)</Text>
            <Text style={styles.helper}>
              New transactions will use this bank by default. You can change
              the bank for an individual transaction.
            </Text>

            <BankSelector
              selectedBankId={bankId}
              onSelect={setBankId}
            />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (pressed || saving) && styles.buttonPressed,
          ]}
          onPress={handleCreateBook}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Creating...' : 'Create Book'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FB',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#172033',
    marginBottom: 8,
  },
  description: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 10,
  },
  helper: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE2EC',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#172033',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
  },
  button: {
    backgroundColor: '#3159C7',
    paddingVertical: 17,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
