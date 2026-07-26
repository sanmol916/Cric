import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, TabParamList } from './types';
import { colors } from '../theme';
import { useAuth } from '../store/AuthContext';
import { useMatch } from '../store/matchStore';
import { usePersistedFlag } from '../hooks/useFlag';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SetupMatchScreen } from '../screens/SetupMatchScreen';
import { LiveScoringScreen } from '../screens/LiveScoringScreen';
import { ScorecardScreen } from '../screens/ScorecardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.red,
    background: colors.bg0,
    card: colors.bg1,
    text: colors.text0,
    border: colors.border,
    notification: colors.red,
  },
};

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg1, borderTopColor: colors.border, height: 60, paddingBottom: 6 },
        tabBarActiveTintColor: colors.redBright,
        tabBarInactiveTintColor: colors.text3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🕑" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🏏</Text>
      <ActivityIndicator color={colors.red} />
    </View>
  );
}

export function RootNavigator() {
  const auth = useAuth();
  const { hydrated } = useMatch();
  const onboarded = usePersistedFlag('cric:onboarded');

  if (auth.initializing || !hydrated || !onboarded.loaded) {
    return <Splash />;
  }

  if (!onboarded.value) {
    return <OnboardingScreen onDone={() => onboarded.setValue(true)} />;
  }

  if (!auth.user) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg1 },
          headerTintColor: colors.text0,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg0 },
        }}
      >
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="SetupMatch" component={SetupMatchScreen} options={{ title: 'New match' }} />
        <Stack.Screen name="LiveScoring" component={LiveScoringScreen} options={{ title: 'Live scoring' }} />
        <Stack.Screen name="Scorecard" component={ScorecardScreen} options={{ title: 'Scorecard' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
