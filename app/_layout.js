import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '../src/lib/store';
import { colors } from '../src/theme';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../src/lib/features/auth/authSlice';
import { loadUserSettings } from '../src/lib/features/ui/uiSlice';
import { getColors } from '../src/theme';
import React, { useEffect } from 'react';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppWrapper />
    </Provider>
  );
}

function AppWrapper() {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui || { theme: 'dark' });
  const colors = getColors(theme);

  useEffect(() => {
    dispatch(loadUserSettings());
    dispatch(checkAuth({ force: false }));
  }, [dispatch]);

  if (!isInitialized) return null; // Or a splash screen

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="book/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitle: 'Book Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}


