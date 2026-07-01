import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getWeatherDetails, getWeatherDetailsByCoords, type WeatherDetails } from '../services/weatherService';
import { getFavorites, type FavoriteEntry } from '../services/db';
import { getCurrentCoordinates } from '../services/locationService';
import type { DashboardStackParamList } from '../navigation/AppTabs';

const DEFAULT_CITY = 'Paris';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>>();
  const theme = useTheme();
  const [weather, setWeather] = useState<WeatherDetails | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);

      if (storedFavorites[0]) {
        setWeather(await getWeatherDetails(storedFavorites[0].city));
        return;
      }

      const coordinates = await getCurrentCoordinates();
      if (coordinates) {
        setWeather(await getWeatherDetailsByCoords(coordinates.latitude, coordinates.longitude));
        return;
      }

      setWeather(await getWeatherDetails(DEFAULT_CITY));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  const otherFavorites = favorites.filter((favorite) => favorite.city !== weather?.city);

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall">{getGreeting()}</Text>
      <Text variant="bodyMedium" style={styles.dateText}>
        {getFormattedDate()}
      </Text>

      {weather ? (
        <Card
          style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]}
          onPress={() => navigation.navigate('WeatherDetail', { city: weather.city })}
        >
          <Card.Content>
            <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer }}>
              {weather.city}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              {weather.condition}
            </Text>
            <Text variant="displaySmall" style={[styles.temperature, { color: theme.colors.onPrimaryContainer }]}>
              {weather.temperatureCelsius}°C
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="water-percent" size={20} color={theme.colors.onPrimaryContainer} />
                <Text style={{ color: theme.colors.onPrimaryContainer }}>{weather.humidityPercent}%</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="weather-windy" size={20} color={theme.colors.onPrimaryContainer} />
                <Text style={{ color: theme.colors.onPrimaryContainer }}>{weather.windSpeedKmh} km/h</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Favoris
      </Text>
      {otherFavorites.length === 0 ? (
        <Text variant="bodyMedium" style={styles.emptyText}>
          Aucun autre favori pour l'instant.
        </Text>
      ) : (
        otherFavorites.map((favorite) => (
          <Card
            key={favorite.id}
            style={styles.favoriteCard}
            onPress={() => navigation.navigate('WeatherDetail', { city: favorite.city })}
          >
            <Card.Content style={styles.favoriteContent}>
              <View>
                <Text variant="bodyLarge">{favorite.city}</Text>
                <Text variant="bodySmall">{favorite.country}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurface} />
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateText: { marginBottom: 16, textTransform: 'capitalize' },
  heroCard: { marginBottom: 16 },
  temperature: { marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { marginBottom: 8 },
  emptyText: { opacity: 0.6 },
  favoriteCard: { marginBottom: 8 },
  favoriteContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
