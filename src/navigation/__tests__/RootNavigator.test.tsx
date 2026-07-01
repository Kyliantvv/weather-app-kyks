jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// RootNavigator's own render logic never touches these, but AppTabs mounts
// DashboardScreen/SearchScreen which, from Task 11/12 onward, call these
// services on mount. Mocking them here keeps this test isolated from later
// tasks' screen implementations.
jest.mock('../../services/weatherService', () => ({
  searchCity: jest.fn().mockResolvedValue({
    cityId: 1,
    city: 'Paris',
    country: 'FR',
    temperatureCelsius: 20,
    condition: 'clear',
  }),
  getWeatherDetails: jest.fn().mockResolvedValue({
    cityId: 1,
    city: 'Paris',
    country: 'FR',
    temperatureCelsius: 20,
    condition: 'clear',
    humidityPercent: 50,
    windSpeedKmh: 10,
  }),
}));

jest.mock('../../services/db', () => ({
  getFavorites: jest.fn().mockResolvedValue([]),
  getHistory: jest.fn().mockResolvedValue([]),
  addToHistory: jest.fn().mockResolvedValue(undefined),
  addFavorite: jest.fn().mockResolvedValue(undefined),
  removeFavorite: jest.fn().mockResolvedValue(undefined),
  isFavorite: jest.fn().mockResolvedValue(false),
}));

import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';
import { useAuth } from '../../context/AuthContext';

describe('RootNavigator', () => {
  it('shows the auth stack when there is no user', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });

    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByText('Connexion')).toBeTruthy();
  });

  it('shows the app tabs when a user is present', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1' }, isLoading: false });

    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('shows a loading indicator while the auth state resolves', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: true });

    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByTestId('root-loading')).toBeTruthy();
  });
});
