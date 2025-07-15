import React from 'react';
import type { StyleProp, ViewStyle, FlatListProps } from 'react-native';

export interface DiaryCard {
  id: number;
  title: string;
  location: string;
  date: string;
  backgroundImage: string;
  content: string;
}