jest.mock('../../services/weatherService', () => ({
  getWeatherDetails: jest.fn(),
  getWeatherDetailsByCoords: jest.fn(),
  getForecast: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  getFavorites: jest.fn(),
}));

jest.mock('../../services/locationService', () => ({
  getCurrentCoordinates: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../DashboardScreen';
import { getWeatherDetails, getWeatherDetailsByCoords, getForecast } from '../../services/weatherService';
import { getFavorites } from '../../services/db';
import { getCurrentCoordinates } from '../../services/locationService';
import { ThemeProvider } from '../../context/ThemeContext';

const Stack = createNativeStackNavigator();

async function renderDashboard() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="DashboardHome" component={DashboardScreen} />
          <Stack.Screen name="WeatherDetail" component={() => null} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    (getForecast as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the default city weather when there are no favorites and location is unavailable', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (getCurrentCoordinates as jest.Mock).mockResolvedValue(null);
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 60,
      windSpeedKmh: 10,
    });

    await renderDashboard();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('21°C')).toBeTruthy();
    expect(getWeatherDetails).toHaveBeenCalledWith('Paris');
  });

  it('shows the weather for the current position when geolocation succeeds and there are no favorites', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (getCurrentCoordinates as jest.Mock).mockResolvedValue({ latitude: 48.85, longitude: 2.35 });
    (getWeatherDetailsByCoords as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 24,
      condition: 'ensoleillé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });

    await renderDashboard();

    expect(await screen.findByText('24°C')).toBeTruthy();
    expect(getWeatherDetailsByCoords).toHaveBeenCalledWith(48.85, 2.35);
    expect(getWeatherDetails).not.toHaveBeenCalled();
  });

  it('shows the first favorite city weather when favorites exist', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([
      { id: 1, city: 'Lyon', country: 'FR', addedAt: '2026-07-01T00:00:00.000Z' },
    ]);
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 2,
      city: 'Lyon',
      country: 'FR',
      temperatureCelsius: 19,
      condition: 'nuageux',
      humidityPercent: 70,
      windSpeedKmh: 8,
    });

    await renderDashboard();

    await waitFor(() => expect(getWeatherDetails).toHaveBeenCalledWith('Lyon'));
    expect(await screen.findByText('Lyon')).toBeTruthy();
  });

  it('shows an error with a retry button when the weather fetch fails', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (getCurrentCoordinates as jest.Mock).mockResolvedValue(null);
    (getWeatherDetails as jest.Mock).mockRejectedValue(new Error('Problème de connexion réseau, veuillez réessayer'));

    await renderDashboard();

    expect(await screen.findByText('Problème de connexion réseau, veuillez réessayer')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });
});
