import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";

const ANNIVERSARY_KEY = "ANNIVERSARY_DATE";

export default function AnniversaryDetailScreen() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [daysSince, setDaysSince] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const dateStr = await AsyncStorage.getItem(ANNIVERSARY_KEY);
      if (dateStr) {
        const date = new Date(dateStr);
        setStartDate(date);
        const today = new Date();
        const days = Math.floor((+today - +date) / (1000 * 60 * 60 * 24));
        setDaysSince(days);
      }
    })();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: "記念日カウント",
        }}
      />
      <View style={{ flex: 1 }}>
        {/* バツボタン */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topSection}>
          {/* ピンクのカード部分をTouchableOpacityでラップ */}
          <TouchableOpacity onPress={() => router.push("/AnniversaryEdit")}>
            <View style={styles.cardLarge}>
              <Text style={styles.label}>付き合って</Text>
              <View style={styles.cardBottomRow}>
                <Text style={styles.dayCount}>
                  {daysSince}
                  <Text style={styles.days}>days</Text>
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 22,
    color: "#888",
    fontWeight: "bold",
  },
  topSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 80, // バツボタン分の余白
  },
  cardLarge: {
    backgroundColor: "#F6C9CC",
    width: 400,
    height: 200,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 22,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  subText: {
    fontSize: 18,
    color: "#888",
    marginRight: 12,
  },
  dayCount: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#f88",
  },
  days: {
    fontSize: 18,
    color: "#f88",
    marginLeft: 4,
  },
});