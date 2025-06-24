import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Dimensions, View, TouchableOpacity } from "react-native";
import TopSection from "../../components/dayCounter";
import { useRouter } from "expo-router";
import Bluetooth from "@/components/BluetoothCard";
import StackedCards from "@/components/Dairycollect";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ANNIVERSARY_KEY = "ANNIVERSARY_DATE";

export default function App() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(new Date("2024-04-20")); // デフォルト値

  useEffect(() => {
    (async () => {
      const dateStr = await AsyncStorage.getItem(ANNIVERSARY_KEY);
      if (dateStr) setStartDate(new Date(dateStr));
    })();
  }, []);

  const today = new Date();
  const daysSince = Math.floor((+today - +startDate) / (1000 * 60 * 60 * 24));
  const yearsPassed = Math.floor(daysSince / 365);
  const nextAnniversary = yearsPassed + 1;
  const nextAnniversaryDays = nextAnniversary * 365;
  const daysToNextAnniversary = nextAnniversaryDays - daysSince;
  const halfYearsPassed = Math.floor((daysSince - 182.5) / 365);
  const nextHalfAnniversary = halfYearsPassed + 1;
  const nextHalfAnniversaryDays = Math.round(nextHalfAnniversary * 365);
  const daysToNextHalfAnniversary = nextHalfAnniversaryDays - daysSince;

  // ここで日付をYY/MM/DD形式に変換
  const formattedDate = `${String(startDate.getFullYear()).slice(2)}/${String(startDate.getMonth() + 1).padStart(2, "0")}/${String(startDate.getDate()).padStart(2, "0")}`;

  const screenWidth = Dimensions.get("window").width;
  const frameWidth = Math.min(screenWidth - 40, 400);

return (
  <SafeAreaView style={styles.container}>
    <View style={styles.centerBox}>
      <Bluetooth
        onPairingSuccess={() => {}}
        isEnabled={true}
      />
      <StackedCards frameWidth={frameWidth} />
      <TouchableOpacity onPress={() => router.push("/AnniversaryDetail")}>
        <TopSection
          daysSince={daysSince}
          nextAnniversary={nextAnniversary}
          daysToNextAnniversary={daysToNextAnniversary}
          nextHalfAnniversary={nextHalfAnniversary}
          daysToNextHalfAnniversary={daysToNextHalfAnniversary}
          anniversaryDate={formattedDate}
        />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F4",
    paddingTop: 40,
  },
  centerBox: {
    alignItems: "center",
    marginTop: 20,
  },
});