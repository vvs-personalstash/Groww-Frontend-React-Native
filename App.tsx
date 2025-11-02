import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootLayout from './src/app/_layout';
import './src/services/api-test'; // Import to test env variables

export default function App() {
  return (
    <SafeAreaProvider>
      <RootLayout />
    </SafeAreaProvider>
  );
}
