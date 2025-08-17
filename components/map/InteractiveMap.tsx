// components/map/InteractiveMap.tsx
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';
import MapSvg from '../../assets/images/map.svg';
import { EventDetailModal } from './EventDetailModal';
import { EventDetector } from './EventDetector';
import { eventData } from './eventData';
import { EventData } from './types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const InteractiveMap: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const eventDetector = new EventDetector(eventData);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const minScale = Math.max(0.5, screenWidth / (screenWidth * 2), screenHeight / (screenHeight * 2));
      scale.value = clamp(savedScale.value * event.scale, minScale, 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .shouldCancelWhenOutside(false)
    .onEnd((event) => {
      console.log('Tap detected at:', event.x, event.y);
      const detectedEvent = eventDetector.detectEvent(
        event.x,
        event.y,
        screenWidth,
        screenHeight,
        scale.value,
        translateX.value,
        translateY.value
      );
      
      if (detectedEvent) {
        setSelectedEvent(detectedEvent);
        setModalVisible(true);
      }
    });

  const modifiedPanGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate((event) => {
      const maxTranslateX = Math.max(0, (screenWidth * scale.value - screenWidth) / 2 + (screenWidth / 4));
      const maxTranslateY = Math.max(0, (screenHeight * scale.value - screenHeight) / 2 + (screenHeight / 4));

      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -maxTranslateY,
        maxTranslateY
      );
    })
    .onEnd((event) => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      const clampX = [
        -Math.max(0, (screenWidth * scale.value - screenWidth) / 2 + (screenWidth / 4)),
        Math.max(0, (screenWidth * scale.value - screenWidth) / 2 + (screenWidth / 4)),
      ];
      const clampY = [
        -Math.max(0, (screenHeight * scale.value - screenHeight) / 2 + (screenHeight / 4)),
        Math.max(0, (screenHeight * scale.value - screenHeight) / 2 + (screenHeight / 4)),
      ];

      translateX.value = withDecay({
        velocity: event.velocityX,
        clamp: clampX,
      });
      translateY.value = withDecay({
        velocity: event.velocityY,
        clamp: clampY,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const reset = () => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(pinchGesture, modifiedPanGesture)
  );

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <MapSvg width={screenWidth} height={screenHeight} />
        </Animated.View>
      </GestureDetector>
      
      <TouchableOpacity style={styles.resetButton} onPress={reset}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      <EventDetailModal
        visible={modalVisible}
        event={selectedEvent}
        onClose={closeModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  resetButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
  },
});