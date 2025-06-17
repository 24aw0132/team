import React, { useRef } from "react";
import { View, StyleSheet, Pressable, Animated, Text } from "react-native";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export default function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const scaleAnim = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const widthAnim = useRef(state.routes.map(() => new Animated.Value(60))).current; // 圆圈初始宽度

  const handlePress = (index: number, routeName: string, isFocused: boolean) => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim[index], {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim[index], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      ...widthAnim.map((anim, i) =>
        Animated.timing(anim, {
          toValue: i === index ? 120 : 60, // 被点击的圆圈变长，其它恢复
          duration: 200,
          useNativeDriver: false,
        })
      ),
    ]).start();

    if (!isFocused) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={styles.navbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const iconColor = isFocused ? "#E57373" : "#B08585";
        const routeName = route.name as "index" | "explore" | "calendar" | "star" | "list";

        const icons = {
          index: <FontAwesome name="home" size={28} color={iconColor} />,
          explore: <MaterialIcons name="explore" size={28} color={iconColor} />,
          calendar: <Entypo name="calendar" size={28} color={iconColor} />,
          star: <FontAwesome name="star" size={28} color={iconColor} />,
          list: <MaterialIcons name="list" size={28} color={iconColor} />,
        };

        return (
          <Pressable
            key={route.key}
            onPress={() => handlePress(index, route.name, isFocused)}
            style={styles.navButtonContainer}
          >
            <Animated.View
              style={[
                styles.navButton,
                {
                  width: widthAnim[index], // 动态宽度
                  backgroundColor: "#FFEFEF",
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim[index] }] }}>
                {icons[routeName]}
              </Animated.View>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 5,
  },
  navButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  navButton: {
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
  },
});
