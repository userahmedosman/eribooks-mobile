import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { getColors, spacing, borderRadius, typography } from '../../src/theme';
import { 
  Home, 
  Search, 
  Star, 
  ShoppingCart, 
  Newspaper,
  Settings as SettingsIcon 
} from 'lucide-react-native';
import { t } from '../../src/i18n';

// Custom tab bar icon component
function TabIcon({ icon: Icon, focused, color, label, themeColors }) {
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconCircle, 
        focused && { backgroundColor: themeColors.primary + '15' }
      ]}>
        <Icon 
          size={22} 
          color={color} 
          strokeWidth={focused ? 2.5 : 2} 
        />
      </View>
      <Text style={[
        styles.iconLabel, 
        { color: focused ? themeColors.primary : themeColors.textSecondary }
      ]}>
        {label}
      </Text>
      {focused && <View style={[styles.iconDot, { backgroundColor: themeColors.primary }]} />}
    </View>
  );
}

export default function TabLayout() {
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              icon={Home} 
              focused={focused} 
              color={color} 
              label={t('navigation.home', language)} 
              themeColors={colors} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              icon={Search} 
              focused={focused} 
              color={color} 
              label={t('navigation.search', language)} 
              themeColors={colors} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              icon={Star} 
              focused={focused} 
              color={color} 
              label={t('navigation.subscriptions', language)} 
              themeColors={colors} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              icon={ShoppingCart} 
              focused={focused} 
              color={color} 
              label={t('navigation.cart', language)} 
              themeColors={colors} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              icon={Newspaper} 
              focused={focused} 
              color={color} 
              label={t('navigation.news', language)} 
              themeColors={colors} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              icon={SettingsIcon} 
              focused={focused} 
              color={color} 
              label={t('navigation.settings', language)} 
              themeColors={colors} 
            />
          ),
        }}
      />
      {/* Hidden legacy profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  iconDot: {
    position: 'absolute',
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
