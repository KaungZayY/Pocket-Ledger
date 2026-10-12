
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { createTransaction } from '@/repositories/transactionRepository';
import { BANKS } from '@/constants/banks';
import type { TransactionDirection } from '@/types/transaction';

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function TransactionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId: string }>();
  const bookId = Number(params.bookId);

  const [direction, setDirection] =
    useState<TransactionDirection>('+');
  const [name, setName] = useState('');
  const [bankId, setBankId] = useState(BANKS[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getToday());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      Alert.alert('Error', 'Invalid book.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Name required', 'Enter the person or business name.');
      return;
    }

    if (!BANKS.some((bank) => bank.id === bankId)) {
      Alert.alert('Bank required', 'Please select a bank.');
      return;
    }

    // Store money as integer minor units, not floating-point values.
    const normalizedAmount = amount.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
      Alert.alert(
        'Invalid amount',
        'Enter a positive amount with up to two decimal places.',
      );
      return;
    }

    const [wholePart, decimalPart = ''] = normalizedAmount.split('.');
    const amountInMinorUnits =
      Number(wholePart) * 100 +
      Number(decimalPart.padEnd(2, '0'));

    if (
      !Number.isSafeInteger(amountInMinorUnits) ||
      amountInMinorUnits <= 0
    ) {
      Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Use the date format YYYY-MM-DD.');
      return;
    }

    const parsedDate = new Date(`${date}T12:00:00`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== Number(date.slice(0, 4)) ||
      parsedDate.getMonth() + 1 !== Number(date.slice(5, 7)) ||
      parsedDate.getDate() !== Number(date.slice(8, 10))
    ) {
      Alert.alert('Invalid date', 'Enter a real calendar date.');
      return;
    }

    try {
      setSaving(true);

      await createTransaction({
        bookId,
        name: name.trim(),
        bankId,
        amount: amountInMinorUnits,
        direction,
        transactionDate: `${date}T12:00:00`,
      });

      router.back();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      Alert.alert('Error', 'Could not save the transaction.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Transaction',
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>New transaction</Text>
          <Text style={styles.description}>
            Record money coming into or going out of this book.
          </Text>

          <Text style={styles.label}>Direction</Text>

          <View style={styles.directionRow}>
            <Pressable
              onPress={() => setDirection('+')}
              style={[
                styles.directionButton,
                direction === '+' && styles.creditSelected,
              ]}
            >
              <Text
                style={[
                  styles.directionText,
                  direction === '+' && styles.selectedText,
                ]}
              >
                ↑  Credit
              </Text>
              <Text style={styles.directionHint}>Money in</Text>
            </Pressable>

            <Pressable
              onPress={() => setDirection('-')}
              style={[
                styles.directionButton,
                direction === '-' && styles.debitSelected,
              ]}
            >
              <Text
                style={[
                  styles.directionText,
                  direction === '-' && styles.selectedText,
                ]}
              >
                ↓  Debit
              </Text>
              <Text style={styles.directionHint}>Money out</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Salary, John, Supermarket"
            placeholderTextColor="#94A3B8"
            maxLength={100}
            returnKeyType="next"
          />

          <Text style={styles.label}>Bank account</Text>
          <View style={styles.bankList}>
            {BANKS.map((bank) => {
              const selected = bankId === bank.id;

              return (
                <Pressable
                  key={bank.id}
                  onPress={() => setBankId(bank.id)}
                  style={[
                    styles.bankOption,
                    selected && styles.bankSelected,
                  ]}
                >
                  <View style={styles.bankIcon}>
                    <Text style={styles.bankIconText}>
                      {bank.name.charAt(0)}
                    </Text>
                  </View>

                  <Text style={styles.bankName}>{bank.name}</Text>

                  <View
                    style={[
                      styles.radio,
                      selected && styles.radioSelected,
                    ]}
                  >
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={(value) => {
              if (/^\d*\.?\d{0,2}$/.test(value)) {
                setAmount(value);
              }
            }}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
          />

          <Text style={styles.hint}>
            Enter the amount without a currency symbol.
          </Text>

          <Text style={styles.label}>Transaction date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            maxLength={10}
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || saving) && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Transaction'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
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
    marginBottom: 26,
  },
  label: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  directionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE2EC',
    borderRadius: 14,
    padding: 16,
  },
  creditSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  debitSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  directionText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
  },
  selectedText: {
    color: '#172033',
  },
  directionHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE2EC',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 15,
    color: '#172033',
  },
  bankList: {
    gap: 8,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    padding: 12,
  },
  bankSelected: {
    borderColor: '#3159C7',
    backgroundColor: '#F0F4FF',
  },
  bankIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#E8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankIconText: {
    color: '#3159C7',
    fontWeight: '800',
    fontSize: 15,
  },
  bankName: {
    flex: 1,
    color: '#172033',
    fontSize: 14,
    fontWeight: '600',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#3159C7',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3159C7',
  },
  hint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#3159C7',
    borderRadius: 15,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
