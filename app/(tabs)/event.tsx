// app/(tabs)/event.tsx
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { EventCard } from '@/components/map/EventCard';
import { EventDetailModal } from '@/components/map/EventDetailModal';
import { eventData } from '@/components/map/eventData';
import { EventData } from '@/components/map/types';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function EventScreen() {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleEventPress = (event: EventData) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">イベント一覧</ThemedText>
        <ThemedText style={styles.subtitle}>
          地域で開催される様々なイベントをご覧ください
        </ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {eventData.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event)}
          />
        ))}
      </ScrollView>

      <EventDetailModal
        visible={modalVisible}
        event={selectedEvent}
        onClose={closeModal}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
});