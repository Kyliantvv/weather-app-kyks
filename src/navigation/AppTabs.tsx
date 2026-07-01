import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { WeatherDetailScreen } from '../screens/WeatherDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  WeatherDetail: { city: string };
};

export type SearchStackParamList = {
  SearchHome: undefined;
  WeatherDetail: { city: string };
};

const DashboardStackNav = createNativeStackNavigator<DashboardStackParamList>();
function DashboardStack() {
  return (
    <DashboardStackNav.Navigator>
      <DashboardStackNav.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStackNav.Screen
        name="WeatherDetail"
        component={WeatherDetailScreen}
        options={{ title: 'Détail météo' }}
      />
    </DashboardStackNav.Navigator>
  );
}

const SearchStackNav = createNativeStackNavigator<SearchStackParamList>();
function SearchStack() {
  return (
    <SearchStackNav.Navigator>
      <SearchStackNav.Screen name="SearchHome" component={SearchScreen} options={{ headerShown: false }} />
      <SearchStackNav.Screen
        name="WeatherDetail"
        component={WeatherDetailScreen}
        options={{ title: 'Détail météo' }}
      />
    </SearchStackNav.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
