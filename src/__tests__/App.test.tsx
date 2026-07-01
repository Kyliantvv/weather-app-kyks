jest.mock('../services/authService', () => ({
  subscribeToAuthChanges: jest.fn((callback: (user: null) => void) => {
    callback(null);
    return jest.fn();
  }),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock('../services/db', () => ({
  initDb: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/syncService', () => ({
  mergeFromCloud: jest.fn().mockResolvedValue(undefined),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../../App';

test('renders the login screen when no user is authenticated', async () => {
  render(<App />);

  await waitFor(() => expect(screen.getByText('Connexion')).toBeTruthy());
});
