import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";

const ANNIVERSARY_KEY = "ANNIVERSARY_DATE";

export default function AnniversaryEdit() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const router = useRouter();

  // 記念日を保存
  const save = async () => {
    await AsyncStorage.setItem(ANNIVERSARY_KEY, date.toISOString());
    router.replace("/AnniversaryDetail");
  };

  // 記念日を取得して初期値にセット
  useEffect(() => {
    (async () => {
      const dateStr = await AsyncStorage.getItem(ANNIVERSARY_KEY);
      if (dateStr) setDate(new Date(dateStr));
    })();
  }, []);

  // 日付を「yyyy年 mm月 dd日」形式で表示
  const formattedDate = `${date.getFullYear()}年 ${String(date.getMonth() + 1).padStart(2, "0")}月 ${String(date.getDate()).padStart(2, "0")}日`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        {/* バツボタン */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.replace("/AnniversaryDetail")}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* 日付表示とピッカー */}
        <TouchableOpacity onPress={() => setShow(true)} style={{ marginTop: 100, marginBottom: 24 }}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, selectedDate) => {
              setShow(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* 保存ボタン */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveButtonText}>保存</Text>
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
  dateText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#F6C9CC",
    borderRadius: 16,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#F6C9CC",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
});