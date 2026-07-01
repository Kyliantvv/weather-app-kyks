import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface WeatherVisual {
  icon: IconName;
  gradient: [string, string];
}

interface VisualRule {
  keywords: string[];
  icon: IconName;
  dayGradient: [string, string];
  nightGradient: [string, string];
}

const RULES: VisualRule[] = [
  {
    keywords: ['orage'],
    icon: 'weather-lightning',
    dayGradient: ['#4b4267', '#20202f'],
    nightGradient: ['#2b2440', '#10101a'],
  },
  {
    keywords: ['neige'],
    icon: 'weather-snowy-heavy',
    dayGradient: ['#8ea9c1', '#c9d9e8'],
    nightGradient: ['#3c4a5c', '#1c2733'],
  },
  {
    keywords: ['pluie', 'bruine', 'averse'],
    icon: 'weather-pouring',
    dayGradient: ['#4d6d8c', '#7fa1bd'],
    nightGradient: ['#1f2d3d', '#0e1620'],
  },
  {
    keywords: ['brouillard', 'brume'],
    icon: 'weather-fog',
    dayGradient: ['#8d99a6', '#c3cbd3'],
    nightGradient: ['#3a4048', '#1c1f24'],
  },
  {
    keywords: ['nuageux', 'couvert', 'nuages'],
    icon: 'weather-cloudy',
    dayGradient: ['#6f88a8', '#a9bcd3'],
    nightGradient: ['#2c374a', '#141a24'],
  },
  {
    keywords: ['ciel dégagé', 'dégagé', 'clair', 'ensoleillé'],
    icon: 'weather-sunny',
    dayGradient: ['#3d8bd4', '#7fc9f0'],
    nightGradient: ['#1a2a52', '#0b1330'],
  },
];

const DEFAULT_DAY: [string, string] = ['#3d8bd4', '#7fc9f0'];
const DEFAULT_NIGHT: [string, string] = ['#1a2a52', '#0b1330'];

export const PARIS_TIME_ZONE = 'Europe/Paris';

export function getParisHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TIME_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(date)
  );
}

export function isNightTime(date: Date = new Date()): boolean {
  const hour = getParisHour(date);
  return hour < 7 || hour >= 20;
}

export function getWeatherVisual(condition: string, date: Date = new Date()): WeatherVisual {
  const normalized = condition.toLowerCase();
  const night = isNightTime(date);

  const rule = RULES.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));

  if (!rule) {
    return { icon: night ? 'weather-night' : 'weather-sunny', gradient: night ? DEFAULT_NIGHT : DEFAULT_DAY };
  }

  const icon = night && rule.icon === 'weather-sunny' ? 'weather-night' : rule.icon;
  return { icon, gradient: night ? rule.nightGradient : rule.dayGradient };
}

export function formatHour(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: PARIS_TIME_ZONE,
  });
}
