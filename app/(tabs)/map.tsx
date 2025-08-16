import mapSvgContent from '@/assets/svg/mapSvgContent';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const clampValues = () => {
    'worklet';

    const currentScale = scale.value;
    const minVisibleWidth = width / 2;
    const minVisibleHeight = height / 2;
    const svgWidth = width * currentScale;
    const svgHeight = height * currentScale;
    const maxRightTranslate = Math.max(0, (svgWidth - minVisibleWidth) / 2);
    const maxLeftTranslate = Math.max(0, (svgWidth - minVisibleWidth) / 2);
    const maxDownTranslate = Math.max(0, (svgHeight - minVisibleHeight) / 2);
    const maxUpTranslate = Math.max(0, (svgHeight - minVisibleHeight) / 2);

    translateX.value = Math.max(
      -maxLeftTranslate,
      Math.min(maxRightTranslate, translateX.value)
    );
    translateY.value = Math.max(
      -maxUpTranslate,
      Math.min(maxDownTranslate, translateY.value)
    );
  };

  const resetPosition = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
      clampValues();
    })
    .onEnd(() => {
      if (scale.value < 1.0) {
        scale.value = withSpring(1.0);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1.0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const maxScale = 5.0;
        if (scale.value > maxScale) {
          scale.value = withSpring(maxScale);
          savedScale.value = maxScale;
        } else {
          savedScale.value = scale.value;
        }
        clampValues();
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
      clampValues();
    })
    .onEnd(() => {
      clampValues();
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <SvgXml xml={mapSvgContent} width={width} height={height} />
        </Animated.View>
      </GestureDetector>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetPosition}
        activeOpacity={0.7}
      >
        <Text style={styles.resetButtonText}>⟲</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
  },
  resetButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});