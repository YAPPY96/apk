// components/map/LocationMarker.tsx

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

interface LocationMarkerProps {
  // REMOVED scale, translateX, and translateY from props
  x: number; // 画面座標でのX位置
  y: number; // 画面座標でのY位置
  accuracy?: number; // 位置の精度（メートル）
  visible: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  x,
  y,
  accuracy,
  visible
}) => {
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  // REMOVED: The entire markerStyle animated style is gone.
  // The marker will now inherit its position from the parent Animated.View.

  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const visibilityStyle = useAnimatedStyle(() => ({ // ADDED: Style for visibility
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    // CHANGED: The container no longer uses markerStyle. It just handles visibility.
    <Animated.View style={[styles.container, visibilityStyle]}>
      {accuracy && accuracy < 100 && (
        <Animated.View 
          style={[
            styles.accuracyCircle,
            {
              left: x - (accuracy * 0.5),
              top: y - (accuracy * 0.5),
              width: accuracy,
              height: accuracy,
              borderRadius: accuracy / 2,
            }
          ]} 
        />
      )}
      
      <Animated.View style={[
        styles.marker,
        {
          left: x - 12,
          top: y - 12,
        }
      ]}>
        <Animated.View style={[styles.outerCircle, innerDotStyle]} />
        <Animated.View style={styles.innerDot} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // The container now covers the whole map area, but its contents are positioned absolutely.
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
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
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});