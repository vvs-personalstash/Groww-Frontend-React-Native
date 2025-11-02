import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { lightTheme, darkTheme } from '../constants/theme';

interface LazyImageProps {
  source: { uri: string };
  style?: any;
  placeholder?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export function LazyImage({ 
  source, 
  style, 
  placeholder,
  resizeMode = 'cover' 
}: LazyImageProps) {
  const { state } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const defaultPlaceholder = (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.surface }]}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {!error && (
        <Image
          source={source}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
      
      {(loading || error) && (
        <View style={[styles.overlay, style]}>
          {error ? (
            <View style={[styles.errorPlaceholder, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.errorIcon, { backgroundColor: theme.colors.border }]} />
            </View>
          ) : (
            placeholder || defaultPlaceholder
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
});