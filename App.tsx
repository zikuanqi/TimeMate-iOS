import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import WeekView from './src/components/WeekView';
import TaskPanel from './src/components/TaskPanel';
import FocusSessionPanel from './src/components/FocusSessionPanel';
import AnalyticsPanel from './src/components/AnalyticsPanel';
import ChatPanel from './src/components/ChatPanel';

const Tab = createBottomTabNavigator();

const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366f1',
    background: '#0a0a0a',
    card: '#0a0a0a',
    text: '#f5f5f5',
    border: '#2c2c2e',
    notification: '#6366f1',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={DarkNavTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'calendar';
            switch (route.name) {
              case '日历':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case '任务':
                iconName = focused ? 'checkbox' : 'checkbox-outline';
                break;
              case '番茄钟':
                iconName = focused ? 'timer' : 'timer-outline';
                break;
              case '分析':
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                break;
              case 'AI':
                iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                break;
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#71717a',
          tabBarStyle: {
            backgroundColor: '#0a0a0a',
            borderTopColor: '#2c2c2e',
            borderTopWidth: 0.5,
            paddingTop: 4,
            height: 56,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="日历" component={WeekView} />
        <Tab.Screen name="任务" component={TaskPanel} />
        <Tab.Screen name="番茄钟" component={FocusSessionPanel} />
        <Tab.Screen name="分析" component={AnalyticsPanel} />
        <Tab.Screen name="AI" component={ChatPanel} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}