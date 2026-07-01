jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RegisterScreen } from '../RegisterScreen';
import { useAuth } from '../../../context/AuthContext';

const Stack = createNativeStackNavigator();

async function renderRegisterScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('RegisterScreen', () => {
  const signUp = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ signUp });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error for a mismatched confirmation and does not call signUp', async () => {
    await renderRegisterScreen();

    await fireEvent.changeText(screen.getByTestId('register-email'), 'user@example.com');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123');
    await fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Different123');
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls signUp with the validated credentials', async () => {
    signUp.mockResolvedValue(undefined);
    await renderRegisterScreen();

    await fireEvent.changeText(screen.getByTestId('register-email'), 'user@example.com');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123');
    await fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Secret123');
    await fireEvent.press(screen.getByText("S'inscrire"));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('user@example.com', 'Secret123'));
  });

  it('shows the mapped error message when signUp rejects', async () => {
    signUp.mockRejectedValue(new Error('Un compte existe déjà avec cette adresse email'));
    await renderRegisterScreen();

    await fireEvent.changeText(screen.getByTestId('register-email'), 'user@example.com');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123');
    await fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Secret123');
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText('Un compte existe déjà avec cette adresse email')).toBeTruthy();
  });
});
