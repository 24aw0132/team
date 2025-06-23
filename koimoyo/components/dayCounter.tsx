// TopSection.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing
} from "react-native";
import AnniversaryEditModal from './AnniversaryEditModal';

type Props = {
  daysSince: number;
  nextAnniversary: number;
  daysToNextAnniversary: number;
  nextHalfAnniversary: number;
  daysToNextHalfAnniversary: number;
};

interface AnniversaryData {
  id: string;
  title: string;
  date: string;
  isVisible: boolean;
}

export default function TopSection({
  daysSince,
  nextAnniversary,
  daysToNextAnniversary,
  nextHalfAnniversary,
  daysToNextHalfAnniversary,
}: Props) {
  const screenWidth = Dimensions.get("window").width;
  const containerWidth = Math.min(screenWidth - 20, 400);

  // 纪念日数据状态
  const [anniversaries, setAnniversaries] = useState<AnniversaryData[]>([
    { id: 'main', title: '付き合った日', date: '24/04/20', isVisible: true },
    { id: 'year', title: `${nextAnniversary}周年まで`, date: '', isVisible: true },
    { id: 'half', title: `${nextHalfAnniversary}年半記念`, date: '', isVisible: true }
  ]);

  // 模态框和编辑状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 动画值 - 为每个可能的ID创建动画值
  const animatedValues = useRef<Record<string, { width: Animated.Value; opacity: Animated.Value }>>({
    main: { width: new Animated.Value(1), opacity: new Animated.Value(1) },
    year: { width: new Animated.Value(1), opacity: new Animated.Value(1) },
    half: { width: new Animated.Value(1), opacity: new Animated.Value(1) }
  }).current;

  // 获取可见的纪念日
  const visibleAnniversaries = anniversaries.filter(a => a.isVisible);
  const baseCardWidth = visibleAnniversaries.length > 0 ? 
    (containerWidth - 40) / visibleAnniversaries.length : 
    containerWidth - 40;

  // 点击卡片处理
  const handleCardPress = (id: string) => {
    const anniversary = anniversaries.find(a => a.id === id);
    if (!anniversary || expandedId) return; // 防止重复点击

    setEditingId(id);
    setEditTitle(anniversary.title);
    setEditDate(anniversary.date);
    setExpandedId(id);

    // 安全地创建动画
    const expandAnimations: Animated.CompositeAnimation[] = [];
    
    visibleAnniversaries.forEach(ann => {
      const animValue = animatedValues[ann.id];
      if (!animValue) return;

      if (ann.id === id) {
        // 展开选中的卡片
        expandAnimations.push(
          Animated.timing(animValue.width, {
            toValue: 2.5, // 展开倍数
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          })
        );
      } else {
        // 压缩其他卡片
        expandAnimations.push(
          Animated.parallel([
            Animated.timing(animValue.width, {
              toValue: 0.2,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.timing(animValue.opacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: false,
            })
          ])
        );
      }
    });

    if (expandAnimations.length > 0) {
      Animated.parallel(expandAnimations).start(() => {
        setModalVisible(true);
      });
    } else {
      setModalVisible(true);
    }
  };

  // 保存编辑
  const handleSave = () => {
    if (!editingId) return;

    setAnniversaries(prev =>
      prev.map(anniversary =>
        anniversary.id === editingId
          ? { ...anniversary, title: editTitle, date: editDate }
          : anniversary
      )
    );

    closeModal();
  };

  // 切换显示状态
  const toggleVisibility = (id: string) => {
    if (expandedId) return; // 展开状态下不允许切换显示

    setAnniversaries(prev =>
      prev.map(anniversary =>
        anniversary.id === id
          ? { ...anniversary, isVisible: !anniversary.isVisible }
          : anniversary
      )
    );
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    
    // 恢复动画
    const restoreAnimations: Animated.CompositeAnimation[] = [];
    
    Object.values(animatedValues).forEach(animValue => {
      restoreAnimations.push(
        Animated.parallel([
          Animated.timing(animValue.width, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(animValue.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          })
        ])
      );
    });

    Animated.parallel(restoreAnimations).start(() => {
      setExpandedId(null);
    });
  };

  // 获取卡片数据
  const getCardData = (id: string) => {
    switch (id) {
      case 'main':
        return { days: daysSince, subText: anniversaries.find(a => a.id === id)?.date || '24/04/20' };
      case 'year':
        return { days: daysToNextAnniversary, subText: '' };
      case 'half':
        return { days: daysToNextHalfAnniversary, subText: '' };
      default:
        return { days: 0, subText: '' };
    }
  };

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      <View style={styles.cardsRow}>
        {visibleAnniversaries.map((anniversary) => {
          const cardData = getCardData(anniversary.id);
          const isExpanded = expandedId === anniversary.id;
          const animValue = animatedValues[anniversary.id];
          
          if (!animValue) return null; // 安全检查

          return (
            <Animated.View
              key={anniversary.id}
              style={[
                styles.cardContainer,
                {
                  width: animValue.width.interpolate({
                    inputRange: [0.2, 1, 2.5],
                    outputRange: [baseCardWidth * 0.2, baseCardWidth, baseCardWidth * 2.5],
                    extrapolate: 'clamp',
                  }),
                  opacity: animValue.opacity,
                }
              ]}
            >
              <TouchableOpacity
                style={[styles.card, isExpanded && styles.expandedCard]}
                onPress={() => handleCardPress(anniversary.id)}
                activeOpacity={0.8}
                disabled={!!expandedId && expandedId !== anniversary.id} // 防止在展开状态下点击其他卡片
              >
                <View style={styles.cardContent}>
                  <Text style={styles.label} numberOfLines={2}>{anniversary.title}</Text>
                  {cardData.subText ? (
                    <Text style={styles.subText}>{cardData.subText}</Text>
                  ) : null}
                  <Text style={styles.dayCount}>
                    {cardData.days}
                    <Text style={styles.days}>days</Text>
                  </Text>
                </View>

                {/* 可见性切换按钮 - 只在非展开状态显示 */}
                {!expandedId && (
                  <TouchableOpacity
                    style={styles.visibilityButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleVisibility(anniversary.id);
                    }}
                  >
                    <Text style={styles.visibilityIcon}>👁️</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* 使用分离的编辑模态框组件 */}
      <AnniversaryEditModal
        visible={modalVisible}
        title={editTitle}
        date={editDate}
        onTitleChange={setEditTitle}
        onDateChange={setEditDate}
        onSave={handleSave}
        onCancel={closeModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 8, // 减少垂直内边距
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    alignItems: "center",
    height: 80, // 固定高度，防止垂直变化
  },
  cardContainer: {
    height: 80, // 固定高度
  },
  card: {
    backgroundColor: "#FAD4D0",
    borderRadius: 20,
    padding: 12,
    height: 80, // 固定高度
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
  },
  expandedCard: {
    backgroundColor: "#F0C4C0",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  visibilityButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  visibilityIcon: {
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    color: "#B08585",
    marginBottom: 4,
    textAlign: "center",
  },
  subText: {
    fontSize: 10,
    color: "#B08585",
    textAlign: "center",
  },
  dayCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A47D7D",
    textAlign: "center",
  },
  days: {
    fontSize: 12,
    color: "#B08585",
  },
});