import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { validate, forgotPasswordSchema } from '../../validation/schemas';

export function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    setConfirmation(null);
    const { value, errors } = validate(forgotPasswordSchema, { email });
    setFieldErrors(errors);
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(value.email);
      setConfirmation('Un email de réinitialisation a été envoyé');
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Mot de passe oublié</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="forgot-password-email"
      />
      <HelperText type="error" visible={!!fieldErrors?.email}>
        {fieldErrors?.email}
      </HelperText>
      {formError ? (
        <HelperText type="error" visible testID="forgot-password-form-error">
          {formError}
        </HelperText>
      ) : null}
      {confirmation ? <Text testID="forgot-password-confirmation">{confirmation}</Text> : null}
      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Réinitialiser le mot de passe
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 4 },
});
