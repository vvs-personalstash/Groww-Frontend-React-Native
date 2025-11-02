import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrendingUp, BookmarkCheck, Search, Sun, Moon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ExploreScreen from './index';
import WatchlistScreen from './watchlist';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const { state, dispatch } = useAppContext();
  const navigation = useNavigation();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;

  const ThemeToggle = () => (
    <TouchableOpacity
      onPress={() => dispatch({ type: 'TOGGLE_THEME' })}
      style={{ marginRight: 16 }}
    >
      {state.theme === 'light' ? (
        <Moon size={24} color={theme.colors.text} />
      ) : (
        <Sun size={24} color={theme.colors.text} />
      )}
    </TouchableOpacity>
  );

  const SearchButton = () => (
    <TouchableOpacity
      onPress={() => (navigation as any).navigate('Search')}
      style={{ marginRight: 8 }}
    >
      <Search size={24} color={theme.colors.text} />
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ExploreScreen}
        options={{
          title: 'Home',
          headerRight: () => (
            <>
              <SearchButton />
              <ThemeToggle />
            </>
          ),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TrendingUp color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          title: 'Watchlist',
          headerRight: () => (
            <>
              <SearchButton />
              <ThemeToggle />
            </>
          ),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <BookmarkCheck color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}