import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import TopSection from "../../components/dayCounter";
import { useRouter, useFocusEffect } from "expo-router";
import { Day } from "@/components/Day";
import BluetoothCard from "@/components/BluetoothCard";
import StackedCards from "@/components/Dairycollect";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import NotificationBell from "../../components/NotificationBell";

export default function App() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(new Date("2024-04-20"));
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasAnniversary, setHasAnniversary] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // Firebase から記念日データを取得
            if (userData.anniversaryDate) {
              setStartDate(new Date(userData.anniversaryDate));
              setHasAnniversary(true);
            } else {
              setHasAnniversary(false);
            }
          }
        } catch (error) {
          console.error('ユーザー資料の取得に失敗しました:', error);
        }
      } else {
        setUserProfile(null);
        setHasAnniversary(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // 画面がフォーカスされるたびにStackedCardsと記念日データを更新
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(prev => prev + 1);
      
      // 記念日データを再取得
      if (currentUser) {
        (async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.anniversaryDate) {
                setStartDate(new Date(userData.anniversaryDate));
                setHasAnniversary(true);
              }
            }
          } catch (error) {
            console.error('記念日データの再取得に失敗しました:', error);
          }
        })();
      }
    }, [currentUser])
  );

  const today = new Date();
  const daysSince = Math.floor((+today - +startDate) / (1000 * 60 * 60 * 24));
  const yearsPassed = Math.floor(daysSince / 365);
  const nextAnniversary = yearsPassed + 1;
  const daysToNextAnniversary = (nextAnniversary * 365) - daysSince;
  const nextHalfAnniversary = Math.floor((daysSince + 182.5) / 365);

  const navigateToLogin = () => {
    router.push('/login');
  };

  const navigateToProfile = () => {
    router.push('/mypage');
  };
  const daysToNextHalfAnniversary = Math.round(nextHalfAnniversary * 365 - daysSince);
  const formattedDate = `${String(startDate.getFullYear()).slice(2)}/${String(
    startDate.getMonth() + 1
  ).padStart(2, "0")}/${String(startDate.getDate()).padStart(2, "0")}`;

  const screenWidth = Dimensions.get("window").width;
  const frameWidth = Math.min(screenWidth - 40, 400);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {currentUser && <NotificationBell />}
        </View>
        <Text style={styles.logo}>❤️こいもよう</Text>
        <TouchableOpacity 
          onPress={currentUser ? navigateToProfile : navigateToLogin}
          style={styles.avatarContainer}
        >
          {currentUser ? (
            userProfile?.avatarUrl ? (
              <Image
                source={{ uri: userProfile.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={24} color="#F7A8B8" />
              </View>
            )
          ) : (
            <View style={styles.loginButton}>
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>ログイン</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.centerBox}>
        <View style={{ marginBottom: 15 }}>
          <Day />
        </View>

        <View style={{ marginBottom: 15 }}>
          <BluetoothCard isEnabled={true} />
        </View>

        <View style={{ marginBottom: 15 }}>
          <StackedCards key={refreshKey} frameWidth={frameWidth} />
        </View>

        {currentUser && (
          <TouchableOpacity onPress={() => router.push("/AnniversaryDetail")}>
            <TopSection
              daysSince={hasAnniversary ? daysSince : 0}
              nextAnniversary={nextAnniversary}
              daysToNextAnniversary={daysToNextAnniversary}
              nextHalfAnniversary={nextHalfAnniversary}
              daysToNextHalfAnniversary={daysToNextHalfAnniversary}
              anniversaryDate={hasAnniversary ? formattedDate : ""}
              hasAnniversary={hasAnniversary}
              customTitle={userProfile?.anniversaryTitle || ""}
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF6F4",
    paddingTop: 35,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f66",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fbb",
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7A8B8',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7A8B8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerBox: {
    alignItems: "center",
    marginTop: 15,
    width: "100%",
  },
});
