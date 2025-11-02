import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';

interface AnimatedWatchlistIconProps {
  isInWatchlist: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}

export function AnimatedWatchlistIcon({
  isInWatchlist,
  onPress,
  size = 24,
  color = '#000000'
}: AnimatedWatchlistIconProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isInWatchlist) {
      // Animate when added to watchlist
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: true,
          damping: 8,
          stiffness: 100,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 8,
          stiffness: 100,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate when removed from watchlist
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isInWatchlist]);

  const handlePress = () => {
    // Trigger press animation
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.8,
        useNativeDriver: true,
        damping: 8,
        stiffness: 200,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 200,
      }),
    ]).start();
    onPress();
  };

  const animatedStyle = {
    transform: [
      { scale },
      {
        rotate: rotation.interpolate({
          inputRange: [-15, 0, 15],
          outputRange: ['-15deg', '0deg', '15deg'],
        }),
      },
    ],
    opacity,
  };

  const iconColor = isInWatchlist ? '#007AFF' : color;

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Animated.View style={animatedStyle}>
        {isInWatchlist ? (
          <BookmarkCheck size={size} color={iconColor} />
        ) : (
          <Bookmark size={size} color={iconColor} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});