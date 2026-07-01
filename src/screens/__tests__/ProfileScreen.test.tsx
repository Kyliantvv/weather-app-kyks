jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useThemeMode: jest.fn(),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';

describe('ProfileScreen', () => {
  beforeEach(() => {
    (useThemeMode as jest.Mock).mockReturnValue({ isDarkMode: false, toggleDarkMode: jest.fn() });
  });

  it('shows the authenticated user email', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut: jest.fn() });

    await render(<ProfileScreen />);

    expect(screen.getByTestId('profile-email').props.children).toBe('user@example.com');
  });

  it('calls signOut when the logout button is pressed', async () => {
    const signOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut });

    await render(<ProfileScreen />);
    await fireEvent.press(screen.getByText('Se déconnecter'));

    expect(signOut).toHaveBeenCalled();
  });

  it('toggles dark mode when the switch is pressed', async () => {
    const toggleDarkMode = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut: jest.fn() });
    (useThemeMode as jest.Mock).mockReturnValue({ isDarkMode: false, toggleDarkMode });

    await render(<ProfileScreen />);
    fireEvent(screen.getByTestId('dark-mode-switch'), 'valueChange', true);

    expect(toggleDarkMode).toHaveBeenCalled();
  });
});
