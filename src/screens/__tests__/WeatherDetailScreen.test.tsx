jest.mock('../../services/weatherService', () => ({
  getWeatherDetails: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  isFavorite: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WeatherDetailScreen } from '../WeatherDetailScreen';
import { getWeatherDetails } from '../../services/weatherService';
import { addFavorite, removeFavorite, isFavorite } from '../../services/db';

const Stack = createNativeStackNavigator();

function renderDetail() {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WeatherDetail">
        <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} initialParams={{ city: 'Paris' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('WeatherDetailScreen', () => {
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

    renderDetail();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('21°C')).toBeTruthy();
    expect(screen.getByText('Humidité : 55%')).toBeTruthy();
    expect(screen.getByText('Vent : 12 km/h')).toBeTruthy();
    expect(screen.getByText('Ajouter aux favoris')).toBeTruthy();
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

    renderDetail();
    await screen.findByText('Ajouter aux favoris');

    fireEvent.press(screen.getByText('Ajouter aux favoris'));

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

    renderDetail();
    await screen.findByText('Retirer des favoris');

    fireEvent.press(screen.getByText('Retirer des favoris'));

    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('Paris'));
    expect(await screen.findByText('Ajouter aux favoris')).toBeTruthy();
  });

  it('shows an error with a retry button when the fetch fails', async () => {
    (getWeatherDetails as jest.Mock).mockRejectedValue(new Error('Ville introuvable : Paris'));
    (isFavorite as jest.Mock).mockResolvedValue(false);

    renderDetail();

    expect(await screen.findByText('Ville introuvable : Paris')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });
});
