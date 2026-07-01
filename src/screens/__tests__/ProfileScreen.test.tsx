jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useAuth } from '../../context/AuthContext';

describe('ProfileScreen', () => {
  it('shows the authenticated user email', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut: jest.fn() });

    render(<ProfileScreen />);

    expect(screen.getByTestId('profile-email').props.children).toBe('user@example.com');
  });

  it('calls signOut when the logout button is pressed', () => {
    const signOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut });

    render(<ProfileScreen />);
    fireEvent.press(screen.getByText('Se déconnecter'));

    expect(signOut).toHaveBeenCalled();
  });
});
