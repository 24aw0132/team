import React from "react";
import { SafeAreaView, StyleSheet, Dimensions, View } from "react-native";
import TopSection from "../../components/dayCounter";

import Bluetooth from "@/components/BluetoothCard"; // 新增组件（假设这是蓝牙卡）
import StackedCards from "@/components/Dairycollect"; // 日记卡

export default function App() {
  const startDate = new Date("2024-04-20");
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

  // 处理屏幕宽度
  const screenWidth = Dimensions.get("window").width;
  const frameWidth = Math.min(screenWidth - 40, 400);

  // 蓝牙配对成功回调
  const handleBluetoothPairingSuccess = () => {
    console.log("ペアリングが成功しました。日記機能が解除されました");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerBox}>
        <Bluetooth
        onPairingSuccess={handleBluetoothPairingSuccess}
        isEnabled={true} // 可根据逻辑控制蓝牙启用
      />
        <StackedCards frameWidth={frameWidth} />
              <TopSection
        daysSince={daysSince}
        nextAnniversary={nextAnniversary}
        daysToNextAnniversary={daysToNextAnniversary}
        nextHalfAnniversary={nextHalfAnniversary}
        daysToNextHalfAnniversary={daysToNextHalfAnniversary}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: "#FDF6F4",
    paddingTop: 40,
  },
  centerBox: {
    alignItems: "center",
    marginTop: 20,
  },
});
