// components/map/LocationIndicator.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocationContext } from './LocationContext';

export const LocationIndicator: React.FC = () => {
  const { locationState } = useLocationContext();

  if (!locationState.isLoading && !locationState.error && locationState.hasPermission) {
    return null; // 正常時は表示しない
  }

  const getStatusColor = () => {
    if (locationState.error) return '#FF4444';
    if (locationState.isLoading) return '#4A90E2';
    if (!locationState.hasPermission) return '#FFA500';
    return '#4A90E2';
  };

  const getStatusText = () => {
    if (locationState.error) return `エラー: ${locationState.error}`;
    if (locationState.isLoading) return '位置情報を取得中...';
    if (!locationState.hasPermission) return '位置情報の権限が必要です';
    return '位置情報サービス準備中';
  };

  const getStatusIcon = () => {
    if (locationState.error) return '⚠️';
    if (!locationState.hasPermission) return '🔒';
    return '📍';
  };

  return (
    <View style={[styles.container, { borderColor: getStatusColor() }]}>
      <View style={styles.content}>
        {locationState.isLoading ? (
          <ActivityIndicator size="small" color={getStatusColor()} style={styles.icon} />
        ) : (
          <Text style={[styles.icon, { color: getStatusColor() }]}>
            {getStatusIcon()}
          </Text>
        )}
        <Text style={[styles.text, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      {locationState.lastUpdate && (
        <Text style={styles.timestamp}>
          最終更新: {locationState.lastUpdate.toLocaleTimeString('ja-JP')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
});