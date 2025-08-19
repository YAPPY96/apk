// components/map/LocationMarker.tsx
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface LocationMarkerProps {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  x: number; // 画面座標でのX位置
  y: number; // 画面座標でのY位置
  accuracy?: number; // 位置の精度（メートル）
  visible: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  scale,
  translateX,
  translateY,
  x,
  y,
  accuracy,
  visible
}) => {
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // パルスアニメーション
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // 無限ループ
        false
      );
      
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const markerStyle = useAnimatedStyle(() => {
    if (!visible) return { opacity: 0 };

    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, markerStyle]}>
      {/* 精度円（もしaccuracyが提供されている場合） */}
      {accuracy && accuracy < 100 && (
        <Animated.View 
          style={[
            styles.accuracyCircle,
            {
              left: x - (accuracy * 0.5), // 精度に基づく円のサイズ調整
              top: y - (accuracy * 0.5),
              width: accuracy,
              height: accuracy,
              borderRadius: accuracy / 2,
            }
          ]} 
        />
      )}
      
      {/* メインマーカー */}
      <Animated.View style={[
        styles.marker,
        {
          left: x - 12, // マーカーの半分のサイズ分オフセット
          top: y - 12,
        }
      ]}>
        {/* 外側の円（パルスアニメーション） */}
        <Animated.View style={[styles.outerCircle, innerDotStyle]} />
        
        {/* 内側のドット */}
        <Animated.View style={styles.innerDot} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    pointerEvents: 'none', // タッチイベントを透過
  },
  accuracyCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    position: 'absolute',
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});