// components/map/InteractiveMap.tsx
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import mapSvgContent from '../../assets/svg/mapSvgContent';
import { DebugOverlay } from './DebugOverlay';
import { EventDetailModal } from './EventDetailModal';
import { EventDetector } from './EventDetector';
import { eventData } from './eventData';
import { EventData } from './types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const InteractiveMap: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // デバッグモードの状態

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const eventDetector = new EventDetector(eventData);

  // イベント検出をJSスレッドで実行するための関数
  const handleEventDetection = (x: number, y: number) => {
    try {
      console.log('Tap detected at:', x, y);
      const detectedEvent = eventDetector.detectEvent(
        x,
        y,
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
    } catch (error) {
      console.error('Event detection error:', error);
    }
  };

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
    .numberOfTaps(1)
    .shouldCancelWhenOutside(false)
    .onEnd((event) => {
      runOnJS(handleEventDetection)(event.x, event.y);
    });

  const panGesture = Gesture.Pan()
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

  // ジェスチャーの競合を防ぐため、exclusiveにする
  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <SvgXml 
            xml={mapSvgContent} 
            width={screenWidth} 
            height={screenHeight}
            preserveAspectRatio="xMidYMid meet"
          />
        </Animated.View>
      </GestureDetector>
      
      {/* デバッグオーバーレイ - イベントエリアを視覚化 */}
      {debugMode && (
        <DebugOverlay
          scale={scale}
          translateX={translateX}
          translateY={translateY}
          visible={debugMode}
        />
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={reset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.resetButton, { backgroundColor: debugMode ? 'rgba(255,0,0,0.7)' : 'rgba(0,100,0,0.7)' }]} 
          onPress={() => setDebugMode(!debugMode)}
        >
          <Text style={styles.resetButtonText}>
            {debugMode ? 'Debug OFF' : 'Debug ON'}
          </Text>
        </TouchableOpacity>
      </View>

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
  buttonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'column',
    gap: 10,
    zIndex: 1,
  },
  resetButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});