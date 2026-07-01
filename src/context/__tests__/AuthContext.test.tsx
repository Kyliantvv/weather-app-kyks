jest.mock('../../services/authService', () => ({
  subscribeToAuthChanges: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { subscribeToAuthChanges } from '../../services/authService';

function Probe() {
  const { user, isLoading } = useAuth();
  return <Text>{isLoading ? 'loading' : user ? `user:${user.uid}` : 'no-user'}</Text>;
}

describe('AuthContext', () => {
  it('resolves to no-user when Firebase reports none', async () => {
    (subscribeToAuthChanges as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('no-user')).toBeTruthy());
  });

  it('exposes the authenticated user once Firebase reports one', async () => {
    (subscribeToAuthChanges as jest.Mock).mockImplementation((callback) => {
      callback({ uid: '42' });
      return jest.fn();
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('user:42')).toBeTruthy());
  });
});
