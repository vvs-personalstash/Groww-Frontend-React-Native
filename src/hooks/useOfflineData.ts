import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StorageService } from '../services/storage';
import { useAppContext } from '../context/AppContext';

export function useOfflineData() {
  const { state, dispatch } = useAppContext();
  const [isOnline, setIsOnline] = useState(true);
  const [isLoadingCache, setIsLoadingCache] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Load cached data when offline
    if (!isOnline) {
      loadCachedData();
    }
  }, [isOnline]);

  const loadCachedData = async () => {
    setIsLoadingCache(true);
    try {
      const cachedData = await StorageService.getData();
      if (cachedData) {
        if (cachedData.topGainers) {
          dispatch({
            type: 'SET_TOP_GAINERS',
            payload: { data: cachedData.topGainers, loading: false },
          });
        }
        if (cachedData.topLosers) {
          dispatch({
            type: 'SET_TOP_LOSERS',
            payload: { data: cachedData.topLosers, loading: false },
          });
        }
        if (cachedData.watchlists) {
          dispatch({ type: 'SET_WATCHLISTS', payload: cachedData.watchlists });
        }
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const saveCacheData = async () => {
    try {
      await StorageService.saveData({
        topGainers: state.topGainers.data,
        topLosers: state.topLosers.data,
        watchlists: state.watchlists,
        theme: state.theme,
      });
    } catch (error) {
      console.error('Failed to save cache data:', error);
    }
  };

  return {
    isOnline,
    isLoadingCache,
    saveCacheData,
    loadCachedData,
  };
}