import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { validate, loginSchema } from '../../validation/schemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const { value, errors } = validate(loginSchema, { email, password });
    setFieldErrors(errors);
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(value.email, value.password);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Connexion</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="login-email"
      />
      <HelperText type="error" visible={!!fieldErrors?.email}>
        {fieldErrors?.email}
      </HelperText>
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="login-password"
      />
      <HelperText type="error" visible={!!fieldErrors?.password}>
        {fieldErrors?.password}
      </HelperText>
      {formError ? (
        <HelperText type="error" visible testID="login-form-error">
          {formError}
        </HelperText>
      ) : null}
      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Se connecter
      </Button>
      <Button onPress={() => navigation.navigate('Register')}>Créer un compte</Button>
      <Button onPress={() => navigation.navigate('ForgotPassword')}>Mot de passe oublié ?</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 4 },
});
