import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from '../context/AppContext';
import TabLayout from './(tabs)/_layout';
import SearchScreen from './search';
import StockDetailsScreen from './stock-details';
import ViewAllScreen from './view-all';
import WatchlistDetailsScreen from './watchlist-details';
import NotFoundScreen from './+not-found';

const Stack = createNativeStackNavigator();

export default function RootLayout() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={TabLayout} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="StockDetails" component={StockDetailsScreen} />
          <Stack.Screen name="ViewAll" component={ViewAllScreen} />
          <Stack.Screen name="WatchlistDetails" component={WatchlistDetailsScreen} />
          <Stack.Screen name="NotFound" component={NotFoundScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}