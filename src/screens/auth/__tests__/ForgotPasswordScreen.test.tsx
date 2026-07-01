jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForgotPasswordScreen } from '../ForgotPasswordScreen';
import { useAuth } from '../../../context/AuthContext';

const Stack = createNativeStackNavigator();

async function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('ForgotPasswordScreen', () => {
  const resetPassword = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ resetPassword });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error for an invalid email and does not call resetPassword', async () => {
    await renderScreen();

    await fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'not-an-email');
    await fireEvent.press(screen.getByText('Réinitialiser le mot de passe'));

    expect(await screen.findByText("L'adresse email n'est pas valide")).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('shows a confirmation message once resetPassword succeeds', async () => {
    resetPassword.mockResolvedValue(undefined);
    await renderScreen();

    await fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'user@example.com');
    await fireEvent.press(screen.getByText('Réinitialiser le mot de passe'));

    expect(await screen.findByTestId('forgot-password-confirmation')).toBeTruthy();
  });

  it('shows the mapped error message when resetPassword rejects', async () => {
    resetPassword.mockRejectedValue(new Error('Aucun compte ne correspond à cette adresse email'));
    await renderScreen();

    await fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'missing@example.com');
    await fireEvent.press(screen.getByText('Réinitialiser le mot de passe'));

    expect(await screen.findByText('Aucun compte ne correspond à cette adresse email')).toBeTruthy();
  });
});
