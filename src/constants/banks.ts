import type { ImageSourcePropType } from "react-native";

export type Bank = {
  id: string;
  name: string;
  logo: ImageSourcePropType;
};

export const BANKS: Bank[] = [
  {
    id: "kpay",
    name: "K Pay",
    logo: require('@/assets/banks/kbz-logo.webp'),
  },
  {
    id: "wave",
    name: "Wave",
    logo: require('@/assets/banks/wave-logo.jpeg'),
  },
];

export function getBankById(bankId: string | null | undefined) {
  if (!bankId) return undefined;

  return BANKS.find((bank) => bank.id === bankId);
}
