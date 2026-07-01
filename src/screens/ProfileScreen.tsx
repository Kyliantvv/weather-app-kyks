import { View, StyleSheet } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useThemeMode();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Profil</Text>
      <Text testID="profile-email">{user?.email}</Text>
      <View style={styles.row}>
        <Text>Mode sombre</Text>
        <Switch testID="dark-mode-switch" value={isDarkMode} onValueChange={toggleDarkMode} />
      </View>
      <Button mode="contained" onPress={signOut}>
        Se déconnecter
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
