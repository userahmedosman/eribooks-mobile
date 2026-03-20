import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { 
  User,
  Moon,
  Sun,
  Languages,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Info
} from 'lucide-react-native';
import { logoutUser } from '../../src/lib/features/auth/authSlice';
import { updateTheme, updateLanguage } from '../../src/lib/features/ui/uiSlice';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const handleLogout = () => {
    console.log('[Settings] Logout button clicked');
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('settings.logout', language) + '?');
      if (confirmed) {
        dispatch(logoutUser()).then(() => {
          router.replace('/');
        }).catch((err) => console.error('Logout error:', err));
      }
      return;
    }

    Alert.alert(
      t('settings.logout', language), 
      'Are you sure you want to log out?', 
      [
        { text: t('forms.cancel', language) || 'Cancel', style: 'cancel' },
        {
          text: t('settings.logout', language),
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
            router.replace('/');
          },
        },
      ]
    );
  };

  const toggleTheme = (value) => {
    dispatch(updateTheme(value ? 'dark' : 'light'));
  };

  const setLanguage = (lang) => {
    dispatch(updateLanguage(lang));
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'tg', label: 'ትግርኛ' },
    { code: 'ar', label: 'العربية' },
  ];

  const SettingItem = ({ icon: Icon, label, value, type = 'arrow', onPress, color }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.settingItemInfo}>
        <View style={[styles.iconBox, { backgroundColor: (color || colors.primary) + '10' }]}>
          <Icon size={20} color={color || colors.primary} />
        </View>
        <Text style={[styles.settingText, { color: colors.text }]}>{label}</Text>
      </View>
      <View>
        {type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onPress}
            trackColor={{ false: '#3f3f46', true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? undefined : (value ? '#FFF' : '#f4f3f4')}
          />
        ) : type === 'text' ? (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
        ) : (
          <ChevronRight size={20} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.title', language)}</Text>
        </View>

        {/* Profile Section */}
        {isAuthenticated ? (
          <TouchableOpacity 
            style={[styles.profileSection, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/profile')}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.loginPromo, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
          >
            <View style={styles.loginPromoInfo}>
              <Text style={styles.loginPromoTitle}>{t('settings.login', language)}</Text>
              <Text style={styles.loginPromoDesc}>{t('settings.loginPromo', language) || 'Sign in to sync your library across devices'}</Text>
            </View>
            <ChevronRight size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.appearance', language)}</Text>
          <View style={[styles.settingGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem 
              icon={isDark ? Moon : Sun} 
              label={t('settings.darkMode', language)} 
              type="switch" 
              value={isDark} 
              onPress={toggleTheme} 
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.language', language)}</Text>
          <View style={[styles.settingGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {languages.map((lang, index) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  { borderBottomColor: colors.border },
                  index === languages.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={[
                  styles.langLabel,
                  { color: language === lang.code ? colors.primary : colors.text }
                ]}>
                  {lang.label}
                </Text>
                {language === lang.code && <View style={[styles.langDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.support', language)}</Text>
          <View style={[styles.settingGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SettingItem icon={HelpCircle} label={t('settings.help', language)} onPress={() => {}} />
            <SettingItem icon={FileText} label={t('settings.terms', language)} onPress={() => {}} />
            <SettingItem icon={Info} label={t('settings.privacy', language)} onPress={() => {}} />
          </View>
        </View>

        {isAuthenticated && (
          <TouchableOpacity 
            style={[styles.destructiveButton, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]} 
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} style={{ marginRight: 10 }} />
            <Text style={[styles.destructiveButtonText, { color: colors.error }]}>{t('settings.logout', language)}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            {t('settings.version', language)} 1.1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    fontSize: 18,
  },
  userEmail: {
    ...typography.caption,
    marginTop: 2,
  },
  loginPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  loginPromoInfo: {
    flex: 1,
  },
  loginPromoTitle: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 18,
  },
  loginPromoDesc: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 12,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  settingGroup: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  settingItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    ...typography.body,
    fontWeight: '600',
  },
  settingValue: {
    ...typography.bodySmall,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  langLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  destructiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  destructiveButtonText: {
    ...typography.button,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  versionText: {
    ...typography.caption,
    letterSpacing: 1,
  },
});
