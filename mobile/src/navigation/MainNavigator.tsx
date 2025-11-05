import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CouponsScreen from '../screens/CouponsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Cupons" component={CouponsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={HomeTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CampaignDetail"
            component={CampaignDetailScreen}
            options={{ title: 'Detalhes da Promoção' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
