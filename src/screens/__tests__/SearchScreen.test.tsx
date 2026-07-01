jest.mock('../../services/weatherService', () => ({
  searchCity: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  addToHistory: jest.fn(),
  getHistory: jest.fn(),
}));

jest.mock('../../services/syncService', () => ({
  syncNow: jest.fn().mockResolvedValue(undefined),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchScreen } from '../SearchScreen';
import { searchCity } from '../../services/weatherService';
import { addToHistory, getHistory } from '../../services/db';

const Stack = createNativeStackNavigator();

async function renderSearch() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="SearchHome" component={SearchScreen} />
        <Stack.Screen name="WeatherDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('SearchScreen', () => {
  beforeEach(() => {
    (getHistory as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error and does not search for an empty city', async () => {
    await renderSearch();
    await waitFor(() => expect(getHistory).toHaveBeenCalled());

    await fireEvent.press(screen.getByText('Rechercher'));

    expect(await screen.findByText('Le nom de ville est requis')).toBeTruthy();
    expect(searchCity).not.toHaveBeenCalled();
  });

  it('shows the result and records it in history on a successful search', async () => {
    (searchCity as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
    });
    await renderSearch();
    await waitFor(() => expect(getHistory).toHaveBeenCalled());

    await fireEvent.changeText(screen.getByTestId('search-city-input'), 'Paris');
    await fireEvent.press(screen.getByText('Rechercher'));

    expect(await screen.findByText('Paris')).toBeTruthy();
    await waitFor(() => expect(addToHistory).toHaveBeenCalledWith('Paris', 'FR', expect.any(String)));
  });

  it('shows an error message when the city is not found', async () => {
    (searchCity as jest.Mock).mockRejectedValue(new Error('Ville introuvable : Zzzzz'));
    await renderSearch();
    await waitFor(() => expect(getHistory).toHaveBeenCalled());

    await fireEvent.changeText(screen.getByTestId('search-city-input'), 'Zzzzz');
    await fireEvent.press(screen.getByText('Rechercher'));

    expect(await screen.findByText('Ville introuvable : Zzzzz')).toBeTruthy();
  });
});
