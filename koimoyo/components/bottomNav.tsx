// BottomNav.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";

export default function BottomNav() {
  return (
    <View style={styles.navbar}>
      <View style={styles.navButton}>
        <FontAwesome name="home" size={32} color="#B08585" />
      </View>
      <View style={styles.navButton}>
        <MaterialIcons name="calendar-today" size={32} color="#B08585" />
      </View>
      <View style={styles.navButton}>
        <FontAwesome name="star-o" size={24} color="#B08585" />
      </View>
      <View style={styles.navButton}>
        <Entypo name="list" size={32} color="#B08585" />
      </View>
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
  navButton: {
    backgroundColor: "#FFEFEF",
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
