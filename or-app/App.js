import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DetailedOR from './DetailedOR';
import HomeInterface from './HomeInterface';
import MenuInterface from './MenuInterface'; 

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Menu" component={MenuInterface} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeInterface} options={{ title: 'OR List' }} />
        <Stack.Screen name="DetailedOR" component={DetailedOR} options={{ title: 'OR Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}