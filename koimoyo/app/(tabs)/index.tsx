import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import TopSection from "../../components/dayCounter";
import BottomNav from "../../components/bottomNav";

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

  return (
    <SafeAreaView style={styles.container}>
      <TopSection
        daysSince={daysSince}
        nextAnniversary={nextAnniversary}
        daysToNextAnniversary={daysToNextAnniversary}
        nextHalfAnniversary={nextHalfAnniversary}
        daysToNextHalfAnniversary={daysToNextHalfAnniversary}
      />
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F4",
    paddingTop: 40,
  },
});
