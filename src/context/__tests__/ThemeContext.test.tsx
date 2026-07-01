jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useThemeMode } from '../ThemeContext';

function Probe() {
  const { isDarkMode, isLoading, toggleDarkMode } = useThemeMode();
  return (
    <>
      <Text>{isLoading ? 'loading' : isDarkMode ? 'dark' : 'light'}</Text>
      <Button title="toggle" onPress={toggleDarkMode} />
    </>
  );
}

describe('ThemeContext', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to light mode when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText('light')).toBeTruthy());
  });

  it('restores dark mode from storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');

    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText('dark')).toBeTruthy());
  });

  it('toggles and persists the new preference', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText('light')).toBeTruthy());
    await fireEvent.press(screen.getByText('toggle'));

    await waitFor(() => expect(screen.getByText('dark')).toBeTruthy());
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
  });
});
