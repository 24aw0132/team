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
  hasAnniversary?: boolean;
  customTitle?: string;
};

export default function TopSection({
  daysSince,
  nextAnniversary,
  daysToNextAnniversary,
  nextHalfAnniversary,
  daysToNextHalfAnniversary,
  anniversaryDate,
  hasAnniversary = false,
  customTitle = "",
}: Props) {
  
  if (!hasAnniversary) {
    return (
      <View style={styles.topSection}>
        <View style={styles.cardEmpty}>
          <Text style={styles.emptyTitle}>記念日を設定しよう</Text>
          <Text style={styles.emptySubtitle}>タップして記念日を追加</Text>
        </View>
      </View>
    );
  }

  const displayTitle = customTitle || "付き合った日から";

  return (
    <View style={styles.topSection}>
      <View style={styles.cardLarge}>
        <Text style={styles.label}>{displayTitle}</Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.subText}>{anniversaryDate}</Text>
          <View style={styles.dayCountContainer}>
            <Text style={styles.dayCount}>{daysSince}</Text>
            <Text style={styles.days}>日</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardSmall}>
        <Text style={styles.label}>{nextAnniversary}周年まであと</Text>
        <View style={styles.dayCountContainer}>
          <Text style={styles.dayCount}>{daysToNextAnniversary}</Text>
          <Text style={styles.days}>日</Text>
        </View>
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
  cardEmpty: {
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginInline: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
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
  dayCountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  dayCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A47D7D",
  },
  days: {
    fontSize: 16,
    color: "#B08585",
    marginLeft: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#BBB",
  },
});
