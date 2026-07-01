import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, HelperText, List, TextInput, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validate, searchCitySchema } from '../validation/schemas';
import { searchCity, type WeatherSummary } from '../services/weatherService';
import { addToHistory, getHistory, type HistoryEntry } from '../services/db';
import type { SearchStackParamList } from '../navigation/AppTabs';

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SearchStackParamList, 'SearchHome'>>();
  const [city, setCity] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<WeatherSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistory(await getHistory(10));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSearch() {
    setSearchError(null);
    setResult(null);
    const { value, errors } = validate(searchCitySchema, { city });
    setFieldError(errors?.city ?? null);
    if (!value) {
      return;
    }

    setIsLoading(true);
    try {
      const summary = await searchCity(value.city);
      setResult(summary);
      await addToHistory(summary.city, summary.country, new Date().toISOString());
      await loadHistory();
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TextInput label="Rechercher une ville" value={city} onChangeText={setCity} testID="search-city-input" />
      <HelperText type="error" visible={!!fieldError}>
        {fieldError}
      </HelperText>
      <Button mode="contained" onPress={handleSearch} loading={isLoading} disabled={isLoading}>
        Rechercher
      </Button>
      {searchError ? <Text testID="search-error">{searchError}</Text> : null}
      {result ? (
        <Card style={styles.card} onPress={() => navigation.navigate('WeatherDetail', { city: result.city })}>
          <Card.Title title={result.city} subtitle={result.condition} />
          <Card.Content>
            <Text variant="displaySmall">{result.temperatureCelsius}°C</Text>
          </Card.Content>
        </Card>
      ) : null}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Historique
      </Text>
      {history.map((entry) => (
        <List.Item
          key={entry.id}
          title={entry.city}
          description={entry.country}
          onPress={() => navigation.navigate('WeatherDetail', { city: entry.city })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginVertical: 16 },
  sectionTitle: { marginBottom: 8 },
});
