// components/map/DebugOverlay.tsx
// 開発時にイベントエリアを視覚化するためのデバッグコンポーネント

import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { eventData } from './eventData';

interface DebugOverlayProps {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  visible?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SVG_WIDTH = 210;
const SVG_HEIGHT = 297;

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  scale,
  translateX,
  translateY,
  visible = false
}) => {
  if (!visible) return null;

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      {eventData.map((event) => {
        const { x, y, width, height } = event.position;
        
        // SVG座標を画面座標に変換
        const screenX = (x / SVG_WIDTH) * screenWidth;
        const screenY = (y / SVG_HEIGHT) * screenHeight;
        const screenWidth_rect = (width / SVG_WIDTH) * screenWidth;
        const screenHeight_rect = (height / SVG_HEIGHT) * screenHeight;
        
        return (
          <View
            key={event.id}
            style={[
              styles.debugRect,
              {
                left: screenX,
                top: screenY,
                width: screenWidth_rect,
                height: screenHeight_rect,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  debugRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 0, 0.8)',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
});