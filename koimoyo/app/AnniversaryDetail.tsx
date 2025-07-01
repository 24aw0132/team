import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
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
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* バツボタン */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* ページタイトル */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>記念日カウント</Text>
        </View>

        {/* メインカード */}
        <View style={styles.topSection}>
          <TouchableOpacity onPress={() => router.push("/AnniversaryEdit")}>
            <View style={styles.cardLarge}>
              <Text style={styles.label}>付き合って</Text>

              {/* 数字とブラーを重ねる */}
              <View style={styles.dayWrapper}>
                <Image
                  source={require("../assets/images/blurIMG.png")}
                  style={styles.blurImage}
                />
                <View style={styles.cardBottomRow}>
                  <Text style={styles.dayCount}>{daysSince}</Text>
                  <Text style={styles.days}>days</Text>
                </View>
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
    top: 60,
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
  titleContainer: {
    marginTop: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: "#333",
  },
  topSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 40,
  },
  cardLarge: {
    backgroundColor: "#F6C9CC",
    width: 350,
    height: 200,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 20,
    position: "relative",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  dayWrapper: {
    position: "relative",
    width: 300,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  blurImage: {
    position: "absolute",
    width: 300,
    height: 120,
    resizeMode: "contain",
    zIndex: 0,
  },
  cardBottomRow: {
    flexDirection: "column",
    alignItems: "center",
  },
  dayCount: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  days: {
    fontSize: 18,
    color: "#fff",
  },
});
