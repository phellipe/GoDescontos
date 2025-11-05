import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from './src/services/pushService';
import { useAuthStore } from './src/stores/authStore';
import MainNavigator from './src/navigation/MainNavigator';

const queryClient = new QueryClient();

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <MainNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
