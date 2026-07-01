import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { getWeatherDetails, getForecast, type WeatherDetails, type ForecastEntry } from '../services/weatherService';
import { addFavorite, isFavorite, removeFavorite } from '../services/db';
import { syncNow } from '../services/syncService';
import { WeatherChart } from '../components/WeatherChart';
import type { DashboardStackParamList } from '../navigation/AppTabs';

type WeatherDetailRouteProp = RouteProp<DashboardStackParamList, 'WeatherDetail'>;

export function WeatherDetailScreen() {
  const route = useRoute<WeatherDetailRouteProp>();
  const { city } = route.params;
  const [details, setDetails] = useState<WeatherDetails | null>(null);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [weatherDetails, favoriteState] = await Promise.all([getWeatherDetails(city), isFavorite(city)]);
      setDetails(weatherDetails);
      setFavorite(favoriteState);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
      return;
    }

    try {
      const entries = await getForecast(city);
      setForecast(entries.slice(0, 8));
    } catch {
      setForecast([]);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFavorite() {
    if (!details) return;
    if (favorite) {
      await removeFavorite(details.city);
      setFavorite(false);
    } else {
      await addFavorite(details.city, details.country, new Date().toISOString());
      setFavorite(true);
    }
    syncNow().catch(() => {});
  }

  if (isLoading) {
    return (
      <View style={styles.center} testID="weather-detail-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View style={styles.center}>
        <Text>{error ?? 'Données indisponibles'}</Text>
        <Button onPress={load}>Réessayer</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">{details.city}</Text>
      <Text>{details.condition}</Text>
      <Text variant="displayMedium">{details.temperatureCelsius}°C</Text>
      <Text>Humidité : {details.humidityPercent}%</Text>
      <Text>Vent : {details.windSpeedKmh} km/h</Text>
      <Button mode={favorite ? 'contained' : 'outlined'} onPress={toggleFavorite}>
        {favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      </Button>
      <WeatherChart entries={forecast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
