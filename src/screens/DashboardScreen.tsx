import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getWeatherDetails,
  getWeatherDetailsByCoords,
  getForecast,
  type WeatherDetails,
  type ForecastEntry,
} from '../services/weatherService';
import { getFavorites, type FavoriteEntry } from '../services/db';
import { getCurrentCoordinates } from '../services/locationService';
import { useThemeMode } from '../context/ThemeContext';
import { WeatherStatPill } from '../components/WeatherStatPill';
import { getWeatherVisual, formatHour, getParisHour, PARIS_TIME_ZONE } from '../utils/weatherVisuals';
import type { DashboardStackParamList } from '../navigation/AppTabs';

const DEFAULT_CITY = 'Paris';

function getGreeting(): string {
  const hour = getParisHour(new Date());
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: PARIS_TIME_ZONE,
  });
}

function capitalize(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>>();
  const theme = useTheme();
  const { isDarkMode, toggleDarkMode } = useThemeMode();
  const [weather, setWeather] = useState<WeatherDetails | null>(null);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);

      let currentWeather: WeatherDetails;
      if (storedFavorites[0]) {
        currentWeather = await getWeatherDetails(storedFavorites[0].city);
      } else {
        const coordinates = await getCurrentCoordinates();
        currentWeather = coordinates
          ? await getWeatherDetailsByCoords(coordinates.latitude, coordinates.longitude)
          : await getWeatherDetails(DEFAULT_CITY);
      }
      setWeather(currentWeather);

      try {
        setForecast(await getForecast(currentWeather.city));
      } catch {
        setForecast([]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
        <Button onPress={() => load()}>Réessayer</Button>
      </View>
    );
  }

  const otherFavorites = favorites.filter((favorite) => favorite.city !== weather?.city);
  const visual = weather ? getWeatherVisual(weather.condition) : null;
  const hourlyForecast = forecast.slice(0, 6);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text variant="headlineSmall">{getGreeting()}</Text>
          <Text variant="bodyMedium" style={styles.dateText}>
            {getFormattedDate()}
          </Text>
        </View>
        <IconButton
          icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
          mode="contained-tonal"
          onPress={toggleDarkMode}
          accessibilityLabel="Changer de thème"
        />
      </View>

      {weather && visual ? (
        <Card
          style={styles.heroCard}
          contentStyle={styles.heroCardContent}
          onPress={() => navigation.navigate('WeatherDetail', { city: weather.city })}
        >
          <LinearGradient
            colors={visual.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroLocation}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#ffffff" />
                <Text variant="titleMedium" style={styles.heroText}>
                  {weather.city}
                </Text>
                <Text variant="bodySmall" style={[styles.heroText, styles.heroCountry]}>
                  {weather.country}
                </Text>
              </View>
              <MaterialCommunityIcons name={visual.icon} size={44} color="#ffffff" />
            </View>

            <Text variant="displayMedium" style={[styles.heroText, styles.temperature]}>
              {weather.temperatureCelsius}°C
            </Text>
            <Text variant="bodyLarge" style={styles.heroText}>
              {capitalize(weather.condition)}
              {weather.feelsLikeCelsius != null ? ` · Ressenti ${weather.feelsLikeCelsius}°C` : ''}
            </Text>

            <View style={styles.statsRow}>
              <WeatherStatPill icon="water-percent" label="Humidité" value={`${weather.humidityPercent}%`} tintColor="#ffffff" />
              <WeatherStatPill icon="weather-windy" label="Vent" value={`${weather.windSpeedKmh} km/h`} tintColor="#ffffff" />
              {weather.pressureHpa != null ? (
                <WeatherStatPill icon="gauge" label="Pression" value={`${weather.pressureHpa} hPa`} tintColor="#ffffff" />
              ) : null}
              {weather.visibilityKm != null ? (
                <WeatherStatPill icon="eye-outline" label="Visibilité" value={`${weather.visibilityKm} km`} tintColor="#ffffff" />
              ) : null}
            </View>
          </LinearGradient>
        </Card>
      ) : null}

      {weather?.sunrise != null && weather.sunset != null ? (
        <View style={styles.sunRow}>
          <Card style={styles.sunCard}>
            <Card.Content style={styles.sunCardContent}>
              <MaterialCommunityIcons name="weather-sunset-up" size={22} color={theme.colors.primary} />
              <View>
                <Text variant="bodySmall" style={styles.emptyText}>
                  Lever du soleil
                </Text>
                <Text variant="bodyLarge">{formatHour(weather.sunrise)}</Text>
              </View>
            </Card.Content>
          </Card>
          <Card style={styles.sunCard}>
            <Card.Content style={styles.sunCardContent}>
              <MaterialCommunityIcons name="weather-sunset-down" size={22} color={theme.colors.primary} />
              <View>
                <Text variant="bodySmall" style={styles.emptyText}>
                  Coucher du soleil
                </Text>
                <Text variant="bodyLarge">{formatHour(weather.sunset)}</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      ) : null}

      {hourlyForecast.length > 0 ? (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Prochaines heures
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
            {hourlyForecast.map((entry) => (
              <Card key={entry.timestamp} style={styles.hourlyCard}>
                <Card.Content style={styles.hourlyCardContent}>
                  <Text variant="bodySmall">{formatHour(entry.timestamp)}</Text>
                  <MaterialCommunityIcons
                    name={visual?.icon ?? 'weather-partly-cloudy'}
                    size={22}
                    color={theme.colors.primary}
                  />
                  <Text variant="titleMedium">{entry.temperatureCelsius}°</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Favoris
        </Text>
        <MaterialCommunityIcons name="star" size={18} color={theme.colors.primary} />
      </View>
      {otherFavorites.length === 0 ? (
        <Card style={styles.emptyFavoritesCard}>
          <Card.Content style={styles.emptyFavoritesContent}>
            <MaterialCommunityIcons name="star-outline" size={28} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.emptyText}>
              Aucun autre favori pour l'instant.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        otherFavorites.map((favorite) => (
          <Card
            key={favorite.id}
            style={styles.favoriteCard}
            onPress={() => navigation.navigate('WeatherDetail', { city: favorite.city })}
          >
            <Card.Content style={styles.favoriteContent}>
              <View style={styles.favoriteLeft}>
                <View style={[styles.favoriteAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="city-variant-outline" size={20} color={theme.colors.onPrimaryContainer} />
                </View>
                <View>
                  <Text variant="bodyLarge">{favorite.city}</Text>
                  <Text variant="bodySmall" style={styles.emptyText}>
                    {favorite.country}
                  </Text>
                </View>
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
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dateText: { opacity: 0.7, textTransform: 'capitalize' },
  heroCard: { marginBottom: 16, overflow: 'hidden', borderRadius: 20, elevation: 4 },
  heroCardContent: { padding: 0 },
  heroGradient: { padding: 20 },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  heroText: { color: '#ffffff' },
  heroCountry: { opacity: 0.85 },
  temperature: { marginTop: 4, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 20, marginTop: 18, flexWrap: 'wrap' },
  sunRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  sunCard: { flex: 1, borderRadius: 16 },
  sunCardContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hourlyScroll: { marginBottom: 16 },
  hourlyCard: { marginRight: 10, borderRadius: 16 },
  hourlyCardContent: { alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { marginBottom: 8 },
  emptyText: { opacity: 0.6 },
  emptyFavoritesCard: { marginBottom: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' },
  emptyFavoritesContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favoriteCard: { marginBottom: 8, borderRadius: 16 },
  favoriteContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favoriteLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favoriteAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
