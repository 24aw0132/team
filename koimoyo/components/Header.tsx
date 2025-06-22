import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  logoUri?: string;
  avatarUri?: string;
  onAvatarPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  logoUri = "https://placehold.co/40x40?text=Logo", 
  avatarUri = "https://placehold.co/40x40?text=Me",
  onAvatarPress 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <Image source={{ uri: logoUri }} style={styles.logo} />
      <TouchableOpacity onPress={onAvatarPress}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6, // 减少底部内边距
    backgroundColor: "#FDF6F4",
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
  },
});

export default Header;