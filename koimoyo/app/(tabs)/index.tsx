import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import TopSection from "../../components/dayCounter";
import { useRouter } from "expo-router";
import { Day } from "@/components/Day";
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

  const formattedDate = `${String(startDate.getFullYear()).slice(2)}/${String(
    startDate.getMonth() + 1
  ).padStart(2, "0")}/${String(startDate.getDate()).padStart(2, "0")}`;

  const screenWidth = Dimensions.get("window").width;
  const frameWidth = Math.min(screenWidth - 40, 400);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>❤️こいもよう</Text>
        <TouchableOpacity onPress={() => router.push("/mypage")}>
          <Image
            source={require("../../assets/avatar.png")} // 替换为你的头像图片路径
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.centerBox}>
        <View style={{ marginBottom: 20 }}>
          <Day />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Bluetooth onPairingSuccess={() => {}} isEnabled={true} />
        </View>

        <View style={{ marginBottom: 20 }}>
          <StackedCards frameWidth={frameWidth} />
        </View>

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
    flexDirection: "column",
    backgroundColor: "#FDF6F4",
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f66",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fbb",
  },
  centerBox: {
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
});
