import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchCity, type WeatherSummary } from '../services/weatherService';
import { getFavorites, type FavoriteEntry } from '../services/db';
import type { DashboardStackParamList } from '../navigation/AppTabs';

const DEFAULT_CITY = 'Paris';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>>();
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);
      const cityToShow = storedFavorites[0]?.city ?? DEFAULT_CITY;
      const summary = await searchCity(cityToShow);
      setWeather(summary);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={styles.center} testID="dashboard-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
        <Button onPress={load}>Réessayer</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {weather ? (
        <Card style={styles.card} onPress={() => navigation.navigate('WeatherDetail', { city: weather.city })}>
          <Card.Title title={weather.city} subtitle={weather.condition} />
          <Card.Content>
            <Text variant="displaySmall">{weather.temperatureCelsius}°C</Text>
          </Card.Content>
        </Card>
      ) : null}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Favoris
      </Text>
      {favorites
        .filter((favorite) => favorite.city !== weather?.city)
        .map((favorite) => (
          <Button key={favorite.id} onPress={() => navigation.navigate('WeatherDetail', { city: favorite.city })}>
            {favorite.city}
          </Button>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8 },
});
