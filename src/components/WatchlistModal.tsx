import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { X, Plus, Check } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { lightTheme, darkTheme } from '../constants/theme';
import { Watchlist } from '../types/stock';

interface WatchlistModalProps {
  visible: boolean;
  onClose: () => void;
  stockSymbol: string;
}

export function WatchlistModal({ visible, onClose, stockSymbol }: WatchlistModalProps) {
  const { state, dispatch } = useAppContext();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);
  
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false);

  const handleAddToWatchlist = (watchlistId: string) => {
    const watchlist = state.watchlists.find(w => w.id === watchlistId);
    if (watchlist && watchlist.stocks.includes(stockSymbol)) {
      Alert.alert('Already Added', 'This stock is already in the selected watchlist.');
      return;
    }

    dispatch({
      type: 'ADD_TO_WATCHLIST',
      payload: { watchlistId, symbol: stockSymbol },
    });
    
    onClose();
    Alert.alert('Success', 'Stock added to watchlist!');
  };

  const handleCreateNewWatchlist = () => {
    if (!newWatchlistName.trim()) {
      Alert.alert('Error', 'Please enter a watchlist name.');
      return;
    }

    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: newWatchlistName.trim(),
      stocks: [stockSymbol],
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_WATCHLIST', payload: newWatchlist });
    setNewWatchlistName('');
    setShowNewWatchlistInput(false);
    onClose();
    Alert.alert('Success', 'New watchlist created and stock added!');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Watchlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Add {stockSymbol} to an existing watchlist or create a new one.
          </Text>

          <ScrollView style={styles.watchlistList} showsVerticalScrollIndicator={false}>
            {state.watchlists.map((watchlist) => {
              const isAlreadyAdded = watchlist.stocks.includes(stockSymbol);
              return (
                <TouchableOpacity
                  key={watchlist.id}
                  style={[styles.watchlistItem, isAlreadyAdded && styles.disabledItem]}
                  onPress={() => !isAlreadyAdded && handleAddToWatchlist(watchlist.id)}
                  disabled={isAlreadyAdded}
                >
                  <View style={styles.watchlistInfo}>
                    <Text style={[styles.watchlistName, isAlreadyAdded && styles.disabledText]}>
                      {watchlist.name}
                    </Text>
                    <Text style={[styles.stockCount, isAlreadyAdded && styles.disabledText]}>
                      {watchlist.stocks.length} stocks
                    </Text>
                  </View>
                  {isAlreadyAdded && (
                    <Check size={20} color={theme.colors.success} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {showNewWatchlistInput ? (
            <View style={styles.newWatchlistContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter watchlist name"
                placeholderTextColor={theme.colors.textSecondary}
                value={newWatchlistName}
                onChangeText={setNewWatchlistName}
                autoFocus
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowNewWatchlistInput(false);
                    setNewWatchlistName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateNewWatchlist}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newWatchlistButton}
              onPress={() => setShowNewWatchlistInput(true)}
            >
              <Plus size={20} color={theme.colors.primary} />
              <Text style={styles.newWatchlistText}>Create New Watchlist</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: typeof lightTheme, screenWidth: number) {
  const isTablet = screenWidth >= 768;
  const isSmallScreen = screenWidth < 480;
  
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: isSmallScreen ? 16 : 24,
      paddingTop: 24,
      paddingBottom: 32,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      padding: 4,
    },
    subtitle: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.textSecondary,
      marginBottom: 24,
      fontFamily: 'Inter-Regular',
    },
    watchlistList: {
      maxHeight: 200,
      marginBottom: 24,
    },
    watchlistItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    disabledItem: {
      opacity: 0.6,
    },
    watchlistInfo: {
      flex: 1,
    },
    watchlistName: {
      fontSize: isTablet ? 16 : 15,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    stockCount: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    disabledText: {
      color: theme.colors.textSecondary,
    },
    newWatchlistContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 16,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.text,
      marginBottom: 16,
      fontFamily: 'Inter-Regular',
      backgroundColor: theme.colors.surface,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    cancelButtonText: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    createButton: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: isTablet ? 16 : 14,
      color: '#FFFFFF',
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    newWatchlistButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      borderStyle: 'dashed',
      backgroundColor: theme.colors.surface,
    },
    newWatchlistText: {
      marginLeft: 8,
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });
}