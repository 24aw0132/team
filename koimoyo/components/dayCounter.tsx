// TopSection.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  daysSince: number;
  nextAnniversary: number;
  daysToNextAnniversary: number;
  nextHalfAnniversary: number;
  daysToNextHalfAnniversary: number;
};

export default function TopSection({
  daysSince,
  nextAnniversary,
  daysToNextAnniversary,
  nextHalfAnniversary,
  daysToNextHalfAnniversary,
}: Props) {
  return (
    <View style={styles.topSection}>
      <View style={styles.cardLarge}>
        <Text style={styles.label}>付き合った日</Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.subText}>24/04/20</Text>
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
      <View style={styles.cardSmall}>
        <Text style={styles.label}>{nextHalfAnniversary}年半記念日</Text>
        <Text style={styles.dayCount}>
          {daysToNextHalfAnniversary}
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
    padding: 10,
    width: 205,
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
    padding: 12,
    width: 95,
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
    fontSize: 12,
    fontWeight: "bold",
    color: "#A47D7D",
  },
  days: {
    fontSize: 16,
    color: "#B08585",
  },
});
