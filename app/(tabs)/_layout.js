import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColors, spacing, borderRadius } from '../../src/theme';
import { 
  Home, 
  Search, 
  Crown, 
  Newspaper,
  Settings as SettingsIcon 
} from 'lucide-react-native';
import { t } from '../../src/i18n';

// Custom modern tab bar icon component with active glow and pill
function TabIcon({ icon: Icon, focused, color, label, themeColors }) {
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconCircle, 
        focused && { 
          backgroundColor: themeColors.primaryTranslucent,
        }
      ]}>
        <Icon 
          size={21} 
          color={focused ? themeColors.primary : themeColors.textSecondary} 
          strokeWidth={focused ? 2.4 : 1.8} 
        />
      </View>
      <Text 
        numberOfLines={1}
        style={[
          styles.iconLabel, 
          { 
            color: focused ? themeColors.text : themeColors.textMuted,
            fontWeight: focused ? '700' : '500'
          }
        ]}
      >
        {label}
      </Text>
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: themeColors.gold }]} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);
  const tabBarHeight = 60 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
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
              icon={Crown} 
              focused={focused} 
              color={color} 
              label={t('navigation.subscriptions', language)} 
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
    width: 68,
    position: 'relative',
    paddingTop: 2,
  },
  iconCircle: {
    width: 36,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 2.5,
    borderRadius: 2,
  },
});
