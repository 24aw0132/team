import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform, Alert, ActivityIndicator, TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function AnniversaryEdit() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customTitle, setCustomTitle] = useState("付き合った日から");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadUserAnniversary(user.uid);
      } else {
        setCurrentUser(null);
        router.replace('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserAnniversary = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.anniversaryDate) {
          setDate(new Date(userData.anniversaryDate));
        }
        if (userData.anniversaryTitle) {
          setCustomTitle(userData.anniversaryTitle);
        }
      }
    } catch (error) {
      console.error('記念日の読み込みに失敗しました:', error);
    }
  };

  const save = async () => {
    if (!currentUser) {
      Alert.alert('エラー', 'ユーザーがログインしていません');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};
      
      await setDoc(userRef, {
        ...existingData,
        anniversaryDate: date.toISOString(),
        anniversaryTitle: customTitle,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      Alert.alert('成功', '記念日を保存しました！', [
        { text: 'OK', onPress: () => router.replace("/AnniversaryDetail") }
      ]);
    } catch (error) {
      console.error('記念日の保存に失敗しました:', error);
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return null;
  }

  const formattedDate = `${date.getFullYear()}年 ${String(date.getMonth() + 1).padStart(2, "0")}月 ${String(date.getDate()).padStart(2, "0")}日`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.replace("/AnniversaryDetail")}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>記念日を設定</Text>
          <Text style={styles.subtitle}>二人が一緒になった日を選択してください</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>カスタムタイトル</Text>
          <TextInput
            style={styles.titleInput}
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="例: 付き合った日から、結婚記念日から"
            placeholderTextColor="#CCC"
          />
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.inputLabel}>記念日</Text>
          <TouchableOpacity onPress={() => setShow(true)} style={styles.dateSelector}>
            <Ionicons name="calendar-outline" size={24} color="#FF6B9D" />
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Ionicons name="chevron-down-outline" size={20} color="#999" />
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
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={save}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="heart" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>記念日を保存</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    marginTop: 120,
    alignItems: "center",
    marginBottom: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  dateSelector: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: "#FF6B9D",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B9D",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: "#CCC",
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
  },
});