import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import { lightTheme, darkTheme } from '../constants/theme';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
}

interface SearchBarProps {
  onSelectStock: (symbol: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSelectStock, placeholder = "Search stocks..." }: SearchBarProps) {
  const { state } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width, height);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
const searchTimeout = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchStocks(query);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  // Handle keyboard dismiss
  useEffect(() => {
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      if (!query) {
        setShowResults(false);
        setIsFocused(false);
      }
    });

    return () => {
      keyboardDidHide.remove();
    };
  }, [query]);

  const searchStocks = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchResults = await apiService.searchStocks(searchQuery);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStock = (symbol: string) => {
    setQuery('');
    setShowResults(false);
    setIsFocused(false);
    Keyboard.dismiss();
    onSelectStock(symbol);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Small delay to allow for result selection
    setTimeout(() => {
      if (!query) {
        setIsFocused(false);
        setShowResults(false);
      }
    }, 200);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectStock(item.symbol)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultSymbol}>{item.symbol}</Text>
          <Text style={styles.resultType}>{item.type}</Text>
        </View>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.resultRegion}>{item.region}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Search 
          size={width < 400 ? 18 : 20} 
          color={theme.colors.textSecondary} 
          style={styles.searchIcon} 
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
          selectionColor={theme.colors.primary}
        />
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary} 
            style={styles.loadingIndicator}
          />
        )}
        {query.length > 0 && !loading && (
          <TouchableOpacity 
            onPress={clearSearch} 
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <X size={width < 400 ? 18 : 20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

{showResults && (
  <>
    <View style={styles.resultsContainerInline}>
      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.symbol}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.resultsContent}
        />
      ) : (
        !loading && query.length >= 2 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No stocks found for "{query}"</Text>
          </View>
        )
      )}
    </View>
  </>
)}

    </View>
  );
}

function createStyles(theme: typeof lightTheme, screenWidth: number, screenHeight: number) {
  const isSmallScreen = screenWidth < 400;
  const isVerySmallScreen = screenWidth < 350;
  const maxResultsHeight = Math.min(screenHeight * 0.4, 280);
  
  return StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 1000,
      width: '100%',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: isSmallScreen ? 10 : 12,
      paddingHorizontal: isSmallScreen ? 12 : theme.spacing.md,
      paddingVertical: isSmallScreen ? 10 : theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: isSmallScreen ? 44 : 48, // Minimum touch target
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    searchContainerFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    searchIcon: {
      marginRight: isSmallScreen ? 8 : theme.spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: isVerySmallScreen ? 14 : isSmallScreen ? 15 : theme.typography.fontSize.md,
      color: theme.colors.text,
      fontFamily: 'Inter-Regular',
      paddingVertical: 0, // Remove default padding
      minHeight: isSmallScreen ? 22 : 24,
    },
    loadingIndicator: {
      marginLeft: 8,
    },
    clearButton: {
      padding: isSmallScreen ? 6 : theme.spacing.xs,
      marginLeft: 4,
      minWidth: 28,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
resultsContainerInline: {
  marginTop: 8,
  backgroundColor: theme.colors.background,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: theme.colors.border,
  maxHeight: maxResultsHeight,
  overflow: 'hidden',
},
    resultsList: {
      maxHeight: maxResultsHeight,
    },
    resultsContent: {
      paddingVertical: 4,
    },
    resultItem: {
      paddingHorizontal: isSmallScreen ? 12 : theme.spacing.md,
      paddingVertical: isSmallScreen ? 12 : theme.spacing.md,
      minHeight: isSmallScreen ? 60 : 70,
      justifyContent: 'center',
    },
    resultContent: {
      flex: 1,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    resultSymbol: {
      fontSize: isVerySmallScreen ? 15 : isSmallScreen ? 16 : theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      flex: 1,
    },
    resultType: {
      fontSize: isVerySmallScreen ? 11 : isSmallScreen ? 12 : theme.typography.fontSize.xs,
      color: theme.colors.primary,
      fontFamily: 'Inter-Medium',
      backgroundColor: theme.colors.primary || theme.colors.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      textAlign: 'center',
    },
    resultName: {
      fontSize: isVerySmallScreen ? 13 : isSmallScreen ? 14 : theme.typography.fontSize.sm,
      color: theme.colors.text,
      fontFamily: 'Inter-Regular',
      lineHeight: isSmallScreen ? 18 : 20,
      marginBottom: 2,
    },
    resultRegion: {
      fontSize: isVerySmallScreen ? 11 : isSmallScreen ? 12 : theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: isSmallScreen ? 12 : theme.spacing.md,
    },
    noResultsContainer: {
      padding: isSmallScreen ? 16 : theme.spacing.lg,
      alignItems: 'center',
      minHeight: 80,
      justifyContent: 'center',
    },
    noResultsText: {
      fontSize: isVerySmallScreen ? 14 : isSmallScreen ? 15 : theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
  });
}