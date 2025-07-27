import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";

export default function AnniversaryDetailScreen() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [daysSince, setDaysSince] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnniversary, setHasAnniversary] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadUserAnniversary(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setHasAnniversary(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 当页面获得焦点时重新加载数据
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadUserAnniversary(currentUser.uid);
      }
    }, [currentUser])
  );

  const loadUserAnniversary = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        
        if (userData.anniversaryDate) {
          const anniversaryDate = new Date(userData.anniversaryDate);
          setStartDate(anniversaryDate);
          calculateDaysSince(anniversaryDate);
          setHasAnniversary(true);
        } else {
          setHasAnniversary(false);
        }
      } else {
        // 新用户，创建默认profile
        const defaultProfile = {
          uid: userId,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', userId), defaultProfile);
        setUserProfile(defaultProfile);
        setHasAnniversary(false);
      }
    } catch (error) {
      console.error('ユーザー記念日データの読み込みに失敗しました:', error);
      setHasAnniversary(false);
    }
  };

  const calculateDaysSince = (date: Date) => {
    const today = new Date();
    const timeDifference = today.getTime() - date.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    setDaysSince(daysDifference);
  };

  const handleSetAnniversary = () => {
    if (currentUser) {
      router.push('/AnniversaryEdit');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: "記念日",
          }}
        />
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.push("/")}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.authCard}>
            <Ionicons name="heart-outline" size={80} color="#FF6B9D" style={styles.authIcon} />
            <Text style={styles.authTitle}>ログインして記念日を見る</Text>
            <Text style={styles.authSubtitle}>二人の素敵な時間を記録しよう</Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>ログイン</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: "記念日",
        }}
      />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.push("/")}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>記念日カウント</Text>
          <Text style={styles.subtitle}>素敵な時間を記録</Text>
        </View>

        {hasAnniversary ? (
          <View style={styles.anniversaryContainer}>
            <TouchableOpacity onPress={handleSetAnniversary} style={styles.anniversaryCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={32} color="#FF6B9D" />
                <Text style={styles.cardTitle}>付き合って</Text>
              </View>
              
              <View style={styles.countContainer}>
                <Text style={styles.dayCount}>{daysSince}</Text>
                <Text style={styles.dayLabel}>日</Text>
              </View>
              
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  開始日: {startDate?.toLocaleDateString('ja-JP')}
                </Text>
              </View>
              
              <View style={styles.editHint}>
                <Ionicons name="create-outline" size={16} color="#999" />
                <Text style={styles.editHintText}>タップして編集</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={60} color="#CCC" />
              <Text style={styles.emptyTitle}>まだ記念日が設定されていません</Text>
              <Text style={styles.emptySubtitle}>下のボタンを押して特別な日を設定しましょう</Text>
              
              <TouchableOpacity 
                style={styles.setButton}
                onPress={handleSetAnniversary}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.setButtonText}>記念日を設定</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  authContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
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
    marginBottom: 40,
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
  },
  authCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    maxWidth: 320,
    width: "100%",
  },
  authIcon: {
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  anniversaryContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  anniversaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginLeft: 12,
  },
  countContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  dayCount: {
    fontSize: 64,
    fontWeight: "700",
    color: "#FF6B9D",
  },
  dayLabel: {
    fontSize: 18,
    color: "#666",
    marginTop: 4,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: "#666",
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
  },
  editHintText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  setButton: {
    backgroundColor: "#FF6B9D",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  setButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
