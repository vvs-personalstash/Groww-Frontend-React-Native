import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, useWindowDimensions, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, ChevronRight, BookmarkX, Trash2, TrendingUp, TrendingDown } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import { useAppContext } from '../../context/AppContext';
import { Watchlist } from '../../types/stock';
import { lightTheme, darkTheme } from '../../constants/theme';

export default function WatchlistScreen() {
  const { state, dispatch } = useAppContext();
  const navigation = useNavigation();
  const theme = state.theme === 'light' ? lightTheme : darkTheme;
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width);
  
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleCreateWatchlist = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateWatchlistConfirm = useCallback(() => {
    if (newWatchlistName && newWatchlistName.trim()) {
      const newWatchlist: Watchlist = {
        id: Date.now().toString(),
        name: newWatchlistName.trim(),
        stocks: [],
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_WATCHLIST', payload: newWatchlist });
      setShowCreateModal(false);
      setNewWatchlistName('');
      Alert.alert('Success', 'New watchlist created successfully!');
    } else {
      Alert.alert('Error', 'Please enter a valid watchlist name.');
    }
  }, [newWatchlistName, dispatch]);

  const handleCreateWatchlistCancel = useCallback(() => {
    setShowCreateModal(false);
    setNewWatchlistName('');
  }, []);

  const handleDeleteWatchlist = useCallback((watchlistId: string) => {
    if (state.watchlists.length === 1) {
      Alert.alert('Cannot Delete', 'You must have at least one watchlist.');
      return;
    }

    const watchlistToDelete = state.watchlists.find(w => w.id === watchlistId);
    Alert.alert(
      'Delete Watchlist',
      `Are you sure you want to delete "${watchlistToDelete?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_WATCHLIST', payload: watchlistId });
            Alert.alert('Deleted', 'Watchlist deleted successfully.');
          },
        },
      ]
    );
  }, [state.watchlists, dispatch]);

  const handleWatchlistPress = useCallback((watchlist: Watchlist) => {
    (navigation as any).navigate('WatchlistDetails', {
      watchlistId: watchlist.id,
      watchlistName: watchlist.name
    });
  }, [navigation]);

  const getWatchlistIcon = (stockCount: number) => {
    if (stockCount === 0) {
      return <BookmarkX size={24} color={theme.colors.textSecondary} />;
    } else if (stockCount > 5) {
      return <TrendingUp size={24} color={theme.colors.success} />;
    } else {
      return <TrendingDown size={24} color={theme.colors.primary} />;
    }
  };
  //To fit iple screen sizes 
  const getNumColumns = (screenWidth: number) => {
    if (screenWidth >= 1200) return 3;
    if (screenWidth >= 768) return 2;
    return 1;
  };

  const numColumns = getNumColumns(width);
  const isSmallScreen = width < 480;

  if (state.watchlists.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No Watchlists"
          message="Create your first watchlist to start tracking your favorite stocks."
          icon={<BookmarkX size={48} color={theme.colors.textSecondary} />}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateWatchlist}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Watchlist</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Watchlists</Text>
          <Text style={styles.subtitle}>
            {state.watchlists.length} watchlist{state.watchlists.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Watchlists Grid */}
        <View style={styles.watchlistsContainer}>
          {state.watchlists.map((watchlist, index) => (
            <View 
              key={watchlist.id} 
              style={[
                styles.watchlistCard,
                numColumns > 1 && styles.gridCard,
                numColumns === 2 && index % 2 === 1 && styles.rightCard,
                numColumns === 3 && (index % 3 === 1 || index % 3 === 2) && styles.rightCard,
              ]}
            >
              <TouchableOpacity
                style={styles.watchlistContent}
                onPress={() => handleWatchlistPress(watchlist)}
                activeOpacity={0.7}
              >
                <View style={styles.watchlistHeader}>
                  <View style={styles.iconContainer}>
                    {getWatchlistIcon(watchlist.stocks.length)}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteWatchlist(watchlist.id)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.watchlistInfo}>
                  <Text style={styles.watchlistName} numberOfLines={2}>
                    {watchlist.name}
                  </Text>
                  <Text style={styles.stockCount}>
                    {watchlist.stocks.length} stock{watchlist.stocks.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.createdDate}>
                    Created {new Date(watchlist.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.watchlistFooter}>
                  <View style={styles.statusIndicator}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: watchlist.stocks.length > 0 ? theme.colors.success : theme.colors.textSecondary }
                    ]} />
                    <Text style={styles.statusText}>
                      {watchlist.stocks.length > 0 ? 'Active' : 'Empty'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add New Watchlist Card */}
          <View 
            style={[
              styles.watchlistCard,
              styles.addCard,
              numColumns > 1 && styles.gridCard,
            ]}
          >
            <TouchableOpacity
              style={styles.addWatchlistContent}
              onPress={handleCreateWatchlist}
              activeOpacity={0.7}
            >
              <View style={styles.addIconContainer}>
                <Plus size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.addWatchlistText}>Create New Watchlist</Text>
              <Text style={styles.addWatchlistSubtext}>
                Organize your favorite stocks
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Create Watchlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCreateWatchlistCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Watchlist</Text>
            <Text style={styles.modalSubtitle}>Enter a name for your new watchlist</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newWatchlistName}
              onChangeText={setNewWatchlistName}
              placeholder="Watchlist name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleCreateWatchlistConfirm}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCreateWatchlistCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateWatchlistConfirm}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: typeof lightTheme, screenWidth: number) {
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1200;
  const isSmallScreen = screenWidth < 480;
  
  const getCardWidth = () => {
    const padding = isSmallScreen ? 16 : 24;
    const gap = isSmallScreen ? 12 : 16;
    
    if (isDesktop) {
      return (screenWidth - (padding * 2) - (gap * 2)) / 3;
    } else if (isTablet) {
      return (screenWidth - (padding * 2) - gap) / 2;
    } else {
      return screenWidth - (padding * 2);
    }
  };

  const cardWidth = getCardWidth();
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      paddingHorizontal: isSmallScreen ? 16 : 24,
      paddingTop: isSmallScreen ? 16 : 24,
      paddingBottom: isSmallScreen ? 16 : 20,
    },
    title: {
      fontSize: isDesktop ? 32 : isTablet ? 28 : isSmallScreen ? 24 : 26,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    watchlistsContainer: {
      paddingHorizontal: isSmallScreen ? 16 : 24,
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: isTablet ? 'wrap' : 'nowrap',
      gap: isSmallScreen ? 12 : 16,
    },
    watchlistCard: {
      width: cardWidth,
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: isSmallScreen ? 12 : 16,
    },
    gridCard: {
      marginBottom: 0,
    },
    rightCard: {
      // No additional margin needed with gap
    },
    watchlistContent: {
      padding: isSmallScreen ? 16 : 20,
    },
    watchlistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    watchlistInfo: {
      marginBottom: 16,
    },
    watchlistName: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
      lineHeight: isTablet ? 24 : isSmallScreen ? 20 : 22,
    },
    stockCount: {
      fontSize: isSmallScreen ? 13 : 14,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Medium',
      marginBottom: 2,
    },
    createdDate: {
      fontSize: isSmallScreen ? 11 : 12,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    watchlistFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: isSmallScreen ? 11 : 12,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    addCard: {
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    addWatchlistContent: {
      padding: isSmallScreen ? 16 : 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 160,
    },
    addIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    addWatchlistText: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: theme.colors.primary,
      fontFamily: 'Inter-SemiBold',
      textAlign: 'center',
      marginBottom: 4,
    },
    addWatchlistSubtext: {
      fontSize: isSmallScreen ? 11 : 12,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      marginHorizontal: isSmallScreen ? 16 : 20,
      marginBottom: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderRadius: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    createButtonText: {
      marginLeft: 8,
      fontSize: isSmallScreen ? 14 : 16,
      color: '#FFFFFF',
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginBottom: 20,
      textAlign: 'center',
    },
    modalInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.colors.text,
      fontFamily: 'Inter-Regular',
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
            flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: isSmallScreen ? 16 : 20,
      marginBottom: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderRadius: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-SemiBold',
    },

  });
}