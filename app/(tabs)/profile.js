import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Book,
  Package,
  Star,
  Edit3,
  Globe,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Settings,
  CreditCard
} from 'lucide-react-native';
import { logoutUser } from '../../src/lib/features/auth/authSlice';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const handleLogout = () => {
    console.log('[Profile] Logout button clicked');

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
      t('settings.logout', language) || 'Log Out',
      'Are you sure you want to log out?',
      [
        { text: t('forms.cancel', language) || 'Cancel', style: 'cancel' },
        {
          text: t('settings.logout', language) || 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser());
              router.replace('/');
            } catch (err) {
              console.error('Logout error:', err);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000&auto=format&fit=crop' }}
        style={styles.backgroundImage}
      >
        <SafeAreaView style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={styles.centered}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={56} color={colors.primary} />
            </View>
            <Text style={[styles.notSignedTitle, { color: '#FFF' }]}>{t('navigation.profile', language) || 'Your Profile'}</Text>
            <Text style={[styles.notSignedSubtext, { color: 'rgba(255,255,255,0.7)' }]}>
              Sign in to track your reading progress, access purchases, and manage subscriptions.
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.primaryButtonText}>{t('settings.login', language) || 'Sign In / Join'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Avatar & Info */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          {user?.subscription && (
            <View style={[styles.badge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
              <ShieldCheck size={14} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={[styles.badgeText, { color: colors.success }]}>{t('profile.proMember', language)}</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>{t('profile.library', language)}</Text>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceLight }]}>
              <Book size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.myBooks', language)}</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceLight }]}>
              <Package size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.orders', language)}</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/subscriptions')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceLight }]}>
              <Star size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('navigation.subscriptions', language)}</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>{t('profile.accountSettings', language)}</Text>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceLight }]}>
              <Edit3 size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.editProfile', language)}</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceLight }]}>
              <Globe size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.language', language)}</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '10', borderColor: colors.error + '20' }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout', language) || 'Log Out'}</Text>
        </TouchableOpacity>

        {/* Footer spacing to ensure button is not hidden by tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  notSignedTitle: {
    ...typography.h1,
    textAlign: 'center',
  },
  notSignedSubtext: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  primaryButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
    ...shadows.lg,
  },
  primaryButtonText: {
    ...typography.button,
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  avatarText: {
    ...typography.h1,
  },
  userName: {
    ...typography.h2,
  },
  userEmail: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  menuSectionTitle: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuText: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
  },
  menuArrow: {
    ...typography.h2,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    ...typography.button,
  },
});
