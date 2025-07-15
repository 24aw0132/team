declare module 'react-native-snap-carousel' {
  import * as React from 'react';
  import { FlatListProps, ViewStyle, StyleProp } from 'react-native';

  export interface CarouselProps<T> extends FlatListProps<T> {
    data: T[];
    renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
    sliderWidth: number;
    itemWidth: number;
    layout?: 'default' | 'stack' | 'tinder';
    layoutCardOffset?: number;
    inactiveSlideScale?: number;
    inactiveSlideOpacity?: number;
    contentContainerCustomStyle?: StyleProp<ViewStyle>;
    ref?: React.Ref<any>;
    [key: string]: any;
  }

  export default class Carousel<T> extends React.Component<CarouselProps<T>> {}
}