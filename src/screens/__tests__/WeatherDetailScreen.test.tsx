jest.mock('../../services/weatherService', () => ({
  getWeatherDetails: jest.fn(),
  getForecast: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  isFavorite: jest.fn(),
}));

jest.mock('../../services/syncService', () => ({
  syncNow: jest.fn().mockResolvedValue(undefined),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WeatherDetailScreen } from '../WeatherDetailScreen';
import { getWeatherDetails, getForecast } from '../../services/weatherService';
import { addFavorite, removeFavorite, isFavorite } from '../../services/db';

const Stack = createNativeStackNavigator();

async function renderDetail() {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WeatherDetail">
        <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} initialParams={{ city: 'Paris' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('WeatherDetailScreen', () => {
  beforeEach(() => {
    (getForecast as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the weather details for the given city', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(false);

    await renderDetail();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('21°C')).toBeTruthy();
    expect(screen.getByText('Humidité : 55%')).toBeTruthy();
    expect(screen.getByText('Vent : 12 km/h')).toBeTruthy();
    expect(screen.getByText('Ajouter aux favoris')).toBeTruthy();
  });

  it('shows the forecast chart when the forecast loads successfully', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(false);
    (getForecast as jest.Mock).mockResolvedValue([
      { timestamp: new Date('2026-07-01T12:00:00.000Z').getTime(), temperatureCelsius: 20 },
      { timestamp: new Date('2026-07-01T15:00:00.000Z').getTime(), temperatureCelsius: 23 },
    ]);

    await renderDetail();

    expect(await screen.findByTestId('weather-chart')).toBeTruthy();
  });

  it('does not show a chart or crash when the forecast fails to load', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(false);
    (getForecast as jest.Mock).mockRejectedValue(new Error('network'));

    await renderDetail();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.queryByTestId('weather-chart')).toBeNull();
  });

  it('adds the city to favorites when the button is pressed', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(false);
    (addFavorite as jest.Mock).mockResolvedValue(undefined);

    await renderDetail();
    await screen.findByText('Ajouter aux favoris');

    await fireEvent.press(screen.getByText('Ajouter aux favoris'));

    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('Paris', 'FR', expect.any(String)));
    expect(await screen.findByText('Retirer des favoris')).toBeTruthy();
  });

  it('removes the city from favorites when already a favorite', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(true);
    (removeFavorite as jest.Mock).mockResolvedValue(undefined);

    await renderDetail();
    await screen.findByText('Retirer des favoris');

    await fireEvent.press(screen.getByText('Retirer des favoris'));

    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('Paris'));
    expect(await screen.findByText('Ajouter aux favoris')).toBeTruthy();
  });

  it('shows an error with a retry button when the fetch fails', async () => {
    (getWeatherDetails as jest.Mock).mockRejectedValue(new Error('Ville introuvable : Paris'));
    (isFavorite as jest.Mock).mockResolvedValue(false);

    await renderDetail();

    expect(await screen.findByText('Ville introuvable : Paris')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });
});
