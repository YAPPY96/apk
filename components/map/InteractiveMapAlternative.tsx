// components/map/InteractiveMapAlternative.tsx
// より確実なタッチ検出のための代替実装

import React, { useState } from 'react';
import { Dimensions, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    clamp,
    useAnimatedStyle,
    useSharedValue,
    withDecay,
} from 'react-native-reanimated';
import MapSvg from '../../assets/images/map.svg';
import { DebugOverlay } from './DebugOverlay';
import { eventData } from './eventData';
import { EventDetailModal } from './EventDetailModal';
import { EventDetector } from './EventDetector';
import { EventData } from './types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const InteractiveMapAlternative: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isGesturing, setIsGesturing] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // デバッグモードの切り替え

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const eventDetector = new EventDetector(eventData);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      setIsGesturing(true);
    })
    .onUpdate((event) => {
      const minScale = Math.max(0.5, screenWidth / (screenWidth * 2), screenHeight / (screenHeight * 2));
      scale.value = clamp(savedScale.value * event.scale, minScale, 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      setTimeout(() => setIsGesturing(false), 100);
    });

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onBegin(() => {
      setIsGesturing(true);
    })
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
      
      setTimeout(() => setIsGesturing(false), 100);
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

  const handleTouch = (event: GestureResponderEvent) => {
    // ジェスチャー中でない場合のみタッチを処理
    if (!isGesturing) {
      // pageX, pageYを使用してより正確な座標を取得
      const touchX = event.nativeEvent.pageX;
      const touchY = event.nativeEvent.pageY;
      
      const detectedEvent = eventDetector.detectEvent(
        touchX,
        touchY,
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
    }
  };

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <View onTouchEnd={handleTouch}>
            <MapSvg width={screenWidth} height={screenHeight} />
          </View>
        </Animated.View>
      </GestureDetector>
      
      <TouchableOpacity style={styles.resetButton} onPress={reset}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={() => setDebugMode(!debugMode)}
      >
        <Text style={styles.debugButtonText}>
          Debug {debugMode ? 'OFF' : 'ON'}
        </Text>
      </TouchableOpacity>

      <DebugOverlay
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        visible={debugMode}
      />

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
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 16,
  },
});