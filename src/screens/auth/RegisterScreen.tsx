import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { validate, registerSchema } from '../../validation/schemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Register'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const { value, errors } = validate(registerSchema, { email, password, confirmPassword });
    setFieldErrors(errors);
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(value.email, value.password);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Inscription</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="register-email"
      />
      <HelperText type="error" visible={!!fieldErrors?.email}>
        {fieldErrors?.email}
      </HelperText>
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="register-password"
      />
      <HelperText type="error" visible={!!fieldErrors?.password}>
        {fieldErrors?.password}
      </HelperText>
      <TextInput
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        testID="register-confirm-password"
      />
      <HelperText type="error" visible={!!fieldErrors?.confirmPassword}>
        {fieldErrors?.confirmPassword}
      </HelperText>
      {formError ? (
        <HelperText type="error" visible testID="register-form-error">
          {formError}
        </HelperText>
      ) : null}
      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        S'inscrire
      </Button>
      <Button onPress={() => navigation.navigate('Login')}>J'ai déjà un compte</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 4 },
});
