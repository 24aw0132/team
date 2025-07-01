// TopSection.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  daysSince: number;
  nextAnniversary: number;
  daysToNextAnniversary: number;
  nextHalfAnniversary: number;
  daysToNextHalfAnniversary: number;
  anniversaryDate: string;
};

export default function TopSection({
  daysSince,
  nextAnniversary,
  daysToNextAnniversary,
  nextHalfAnniversary,
  daysToNextHalfAnniversary,
  anniversaryDate,
}: Props) {
  return (
    <View style={styles.topSection}>
      <View style={styles.cardLarge}>
      <Text style={styles.label}>付き合った日から</Text>
        <View style={styles.cardBottomRow}>
        <Text style={styles.subText}>{anniversaryDate}</Text>
        <Text style={styles.dayCount}>
            {daysSince}
        <Text style={styles.days}>days</Text>
      </Text>
    </View>
  </View>
  <View style={styles.cardSmall}>
    <Text style={styles.label}>{nextAnniversary}周年まであと</Text>
    <Text style={styles.dayCount}>
      {daysToNextAnniversary}
          <Text style={styles.days}>days</Text>
        </Text>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  cardLarge: {
    backgroundColor: "#FAD4D0",
    borderRadius: 20,
    padding: 15,
    width: '55%',
    marginInline: 10,
    justifyContent: "center",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSmall: {
    backgroundColor: "#FAD4D0",
    borderRadius: 20,
    padding: 15,
    width: '35%',
    marginInline: 10,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    color: "#B08585",
    marginBottom: 10,
  },
  subText: {
    fontSize: 12,
    color: "#B08585",
  },
  dayCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A47D7D",
  },
  days: {
    fontSize: 16,
    color: "#B08585",
  },
});
