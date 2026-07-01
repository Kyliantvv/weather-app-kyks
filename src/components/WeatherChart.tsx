import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { ForecastEntry } from '../services/weatherService';
import { getParisHour } from '../utils/weatherVisuals';

const CHART_HEIGHT = 100;

interface WeatherChartProps {
  entries: ForecastEntry[];
}

export function WeatherChart({ entries }: WeatherChartProps) {
  if (entries.length === 0) {
    return null;
  }

  const temperatures = entries.map((entry) => entry.temperatureCelsius);
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  const range = maxTemp - minTemp || 1;

  return (
    <View testID="weather-chart" style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Prévisions
      </Text>
      <View style={styles.chart}>
        {entries.map((entry) => {
          const heightRatio = (entry.temperatureCelsius - minTemp) / range;
          const barHeight = Math.max(4, heightRatio * CHART_HEIGHT);
          const label = `${getParisHour(new Date(entry.timestamp))}h`;

          return (
            <View key={entry.timestamp} style={styles.barColumn}>
              <Text style={styles.barValue}>{entry.temperatureCelsius}°</Text>
              <View style={[styles.bar, { height: barHeight }]} />
              <Text style={styles.barLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  title: { marginBottom: 8 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 48,
  },
  barColumn: { alignItems: 'center', flex: 1 },
  bar: {
    width: 12,
    backgroundColor: '#6750A4',
    borderRadius: 6,
  },
  barValue: { fontSize: 11 },
  barLabel: { fontSize: 11, marginTop: 4 },
});
