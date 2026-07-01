jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../../context/AuthContext';

const Stack = createNativeStackNavigator();

async function renderLoginScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={() => null} />
        <Stack.Screen name="ForgotPassword" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen', () => {
  const signIn = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ signIn });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error and does not call signIn for an invalid email', async () => {
    await renderLoginScreen();

    await fireEvent.changeText(screen.getByTestId('login-email'), 'not-an-email');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'somepassword');
    await fireEvent.press(screen.getByText('Se connecter'));

    expect(await screen.findByText("L'adresse email n'est pas valide")).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('calls signIn with the validated credentials', async () => {
    signIn.mockResolvedValue(undefined);
    await renderLoginScreen();

    await fireEvent.changeText(screen.getByTestId('login-email'), 'user@example.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'somepassword');
    await fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('user@example.com', 'somepassword'));
  });

  it('shows the mapped error message when signIn rejects', async () => {
    signIn.mockRejectedValue(new Error('Email ou mot de passe incorrect'));
    await renderLoginScreen();

    await fireEvent.changeText(screen.getByTestId('login-email'), 'user@example.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
    await fireEvent.press(screen.getByText('Se connecter'));

    expect(await screen.findByText('Email ou mot de passe incorrect')).toBeTruthy();
  });
});
