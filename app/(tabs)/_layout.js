import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '../../src/lib/store';
import { colors } from '../../src/theme';

// Custom tab bar icon component
function TabIcon({ name, focused }) {
  const icons = {
    home: '📚',
    search: '🔍',
    cart: '🛒',
    profile: '👤',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <View style={styles.iconText}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.iconDot, focused && styles.iconDotActive]} />
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                <View style={[styles.emoji]}><EmptyEmoji emoji="📚" /></View>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                <EmptyEmoji emoji="🔍" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                <EmptyEmoji emoji="🛒" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                <EmptyEmoji emoji="👤" />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

// Simple text emoji component
import { Text } from 'react-native';
function EmptyEmoji({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconCircleActive: {
    backgroundColor: colors.white10,
  },
  iconContainer: {
    padding: 4,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  iconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  iconDotActive: {
    backgroundColor: colors.primary,
  },
  emoji: {
    fontSize: 20,
  },
});
