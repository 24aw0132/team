import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  Image,
  Text,
  Alert,
} from "react-native";
import TopSection from "../../components/dayCounter";
import { useRouter, useFocusEffect } from "expo-router";
import { Day } from "@/components/Day";
import BluetoothCard from "@/components/BluetoothCard";
import StackedCards from "@/components/Dairycollect";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import NotificationBell from "../../components/NotificationBell";
import UrgentNotification from "../../components/UrgentNotification";

export default function App() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(new Date("2024-04-20"));
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);  
  const [hasAnniversary, setHasAnniversary] = useState(false);
  const [urgentClickCount, setUrgentClickCount] = useState(0); // 催促点击计数

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

  // 监听催促重置通知
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const resetQuery = query(
      collection(db, 'urgent_notifications'),
      where('receiverId', '==', currentUser.uid),
      where('type', '==', 'urgent_reset'),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(resetQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          // 收到重置通知，重置计数
          setUrgentClickCount(0);
          
          // 标记重置通知为已读
          try {
            await updateDoc(doc(db, 'urgent_notifications', change.doc.id), {
              isRead: true
            });
          } catch (error) {
            console.error('标记重置通知已读失败:', error);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  // 催促消息模板
  const urgentMessages = [
    "何か言いたそうだよ", // 第1次
    "ちょっと焦ってるみたい、早く何かしないと", // 第2次
    "ちょっと怒ってるかも", // 第3次
    "もう怒ってるよ", // 第4次
    "お前何してる！早く返事して" // 第5次
  ];

  const handleLogoPress = async () => {
    if (!currentUser || !userProfile) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    // 检查是否有伙伴
    if (!userProfile.partnerId) {
      Alert.alert('エラー', 'パートナーとペアリングしてください');
      return;
    }

    try {
      // 根据 partnerId 查找伙伴用户文档
      const partnerQuery = query(
        collection(db, 'users'), 
        where('userId', '==', userProfile.partnerId)
      );
      const partnerQuerySnapshot = await getDocs(partnerQuery);
      
      if (partnerQuerySnapshot.empty) {
        Alert.alert('エラー', 'パートナー情報が見つかりません');
        return;
      }

      const partnerDoc = partnerQuerySnapshot.docs[0];
      const partnerData = partnerDoc.data();
      const partnerAuthUid = partnerData.authUid;
      const partnerNickname = partnerData.nickname || 'パートナー';

      // 暂时简化逻辑，每次都从计数1开始，避免复杂查询
      const newCount = Math.min(urgentClickCount + 1, 5);
      setUrgentClickCount(newCount);

      const messageIndex = newCount - 1;
      const senderNickname = userProfile.nickname || 'パートナー';

      // 创建催促通知
      await addDoc(collection(db, 'urgent_notifications'), {
        senderId: currentUser.uid,
        senderNickname: senderNickname,
        receiverId: partnerAuthUid,
        level: newCount,
        message: urgentMessages[messageIndex],
        createdAt: serverTimestamp(),
        isRead: false,
        isIgnored: false,
        type: 'urgent'
      });

      Alert.alert(
        '催促送信完了',
        `${partnerNickname}に催促を送信しました`,
        [{ text: 'OK', style: 'default' }]
      );

    } catch (error) {
      console.error('催促通知送信エラー:', error);
      Alert.alert('エラー', '送信に失敗しました。もう一度お試しください');
    }
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
        <TouchableOpacity onPress={handleLogoPress}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
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

      {/* 催促通知弹窗 */}
      {currentUser && <UrgentNotification />}
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
  logoImage: {
    width: 120,
    height: 30,
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
