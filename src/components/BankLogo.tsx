import { Image, StyleSheet, View } from "react-native";
import type { ImageStyle, StyleProp } from "react-native";
import type { Bank } from "../constants/banks";
import { getBankById } from "../constants/banks";

type BankLogoProps = {
  bankId?: string | null;
  size?: number;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function BankLogo({
  bankId,
  size = 40,
  imageStyle,
}: BankLogoProps) {
  const bank = getBankById(bankId);

  if (!bank) return null;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Image
        source={bank.logo}
        style={[styles.logo, imageStyle]}
        resizeMode="contain"
        accessibilityLabel={`${bank.name} logo`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});
