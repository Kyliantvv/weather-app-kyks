import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WeatherStatPillProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  tintColor: string;
}

export function WeatherStatPill({ icon, label, value, tintColor }: WeatherStatPillProps) {
  return (
    <View style={styles.pill}>
      <MaterialCommunityIcons name={icon} size={20} color={tintColor} />
      <Text style={[styles.value, { color: tintColor }]}>{value}</Text>
      <Text style={[styles.label, { color: tintColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    gap: 2,
    minWidth: 64,
  },
  value: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 11, opacity: 0.85 },
});
