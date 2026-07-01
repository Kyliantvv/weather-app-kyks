jest.mock('../../services/weatherService', () => ({
  searchCity: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  getFavorites: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../DashboardScreen';
import { searchCity } from '../../services/weatherService';
import { getFavorites } from '../../services/db';

const Stack = createNativeStackNavigator();

function renderDashboard() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="DashboardHome" component={DashboardScreen} />
        <Stack.Screen name="WeatherDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('DashboardScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the default city weather when there are no favorites', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (searchCity as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
    });

    renderDashboard();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('21°C')).toBeTruthy();
    expect(searchCity).toHaveBeenCalledWith('Paris');
  });

  it('shows the first favorite city weather when favorites exist', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([
      { id: 1, city: 'Lyon', country: 'FR', addedAt: '2026-07-01T00:00:00.000Z' },
    ]);
    (searchCity as jest.Mock).mockResolvedValue({
      cityId: 2,
      city: 'Lyon',
      country: 'FR',
      temperatureCelsius: 19,
      condition: 'nuageux',
    });

    renderDashboard();

    await waitFor(() => expect(searchCity).toHaveBeenCalledWith('Lyon'));
    expect(await screen.findByText('Lyon')).toBeTruthy();
  });

  it('shows an error with a retry button when the weather fetch fails', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (searchCity as jest.Mock).mockRejectedValue(new Error('Problème de connexion réseau, veuillez réessayer'));

    renderDashboard();

    expect(await screen.findByText('Problème de connexion réseau, veuillez réessayer')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });
});
