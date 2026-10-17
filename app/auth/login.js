import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Chrome,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';
import { loginWithGoogle, resetError } from '../../src/lib/features/auth/authSlice';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { ResponseType } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);

  // expo-auth-session works on ALL platforms (web, Expo Go, and production builds)
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      prompt: 'select_account',
    },
    redirectUri: Platform.select({
      web: undefined, // defaults to window.location.origin
      native: AuthSession.makeRedirectUri({ scheme: 'eribooks' }),
    }),
  });

  // Configure native GoogleSignin for Android
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (e) {
        console.warn('[Native] Could not configure GoogleSignin:', e.message);
      }
    }
  }, []);

  // Handle auth response (for web flow)
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('[Auth] OAuth response params:', JSON.stringify(response.params));
      const idToken = response.params?.id_token;
      if (idToken) {
        console.log('[Auth] Got id_token, exchanging with backend...');
        dispatch(loginWithGoogle({ idToken }));
      } else {
        console.warn('[Auth] No id_token in response. Full params:', response.params);
      }
    } else if (response?.type === 'error') {
      console.error('[Auth] Google OAuth error:', response.error);
    }
  }, [response]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(resetError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-redirect to profile after successful login
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Auth] User is authenticated, redirecting to profile...');
      router.replace('/(tabs)/profile');
    }
  }, [isAuthenticated]);

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      promptAsync({ prompt: 'select_account' });
      return;
    }

    // Native flow
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // Ignore if user wasn't signed in natively
      }

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (idToken) {
        console.log('[Native] Google login success, exchanging idToken with backend...');
        dispatch(loginWithGoogle({ idToken }));
      } else {
        console.warn('[Native] Google login success but no idToken found:', userInfo);
      }
    } catch (error) {
      console.error('[Native] Google sign-in error:', error.message);
      if (error.code) {
        console.error('[Native] Error Code:', error.code);
      }
      // Fallback to browser flow
      promptAsync({ prompt: 'select_account' });
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop' }}
        style={styles.backgroundImage}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(11, 13, 23, 0.88)' }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.white10 }]}
            onPress={handleClose}
            accessibilityLabel="Close"
          >
            <X size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Header Brand Section */}
            <View style={styles.headerContainer}>
              <View style={[styles.logoContainer, { borderColor: colors.borderGold, backgroundColor: colors.surface }]}>
                <Image 
                  source={require('../../assets/eri_books_logo.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain" 
                />
              </View>
              
              <View style={styles.titleRow}>
                <Text style={styles.title}>EriBooks</Text>
                <View style={[styles.goldDot, { backgroundColor: colors.gold }]} />
              </View>
              
              <Text style={styles.subtitle}>
                {t('home.subtitle', language) || 'Your Gateway to Eritrean & Global Literature'}
              </Text>
            </View>

            {/* Login Glass Card */}
            <View style={[styles.card, { backgroundColor: colors.surface + 'EE', borderColor: colors.borderLight }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  {t('settings.login', language) || 'Welcome to EriBooks'}
                </Text>
                <Text style={[styles.signInText, { color: colors.textSecondary }]}>
                  {t('auth.signInDesc', language) || 'Sign in with your Google account to sync your library, bookmarks, and audiobooks.'}
                </Text>
              </View>

              {error && (
                <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: colors.error }]}>
                  <AlertCircle size={16} color={colors.error} style={{ marginRight: 8 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.googleButton,
                  { backgroundColor: '#FFFFFF' },
                  loading && styles.googleButtonDisabled,
                ]}
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <>
                    <View style={styles.googleIconWrapper}>
                      <Chrome size={22} color="#0F172A" />
                    </View>
                    <Text style={styles.googleButtonText}>
                      {t('auth.google', language) || 'Continue with Google'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.securityRow}>
                <ShieldCheck size={14} color={colors.gold} style={{ marginRight: 6 }} />
                <Text style={[styles.securityText, { color: colors.textMuted }]}>
                  Secure authentication & cloud sync
                </Text>
              </View>

              <Text style={[styles.termsText, { color: colors.textMuted }]}>
                {t('auth.termsPrompt', language) || 'By continuing, you agree to our Terms of Service & Privacy Policy.'}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl + 10,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    padding: 10,
    ...shadows.lg,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#FFF',
  },
  goldDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  signInText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 54,
    ...shadows.md,
  },
  googleButtonDisabled: {
    opacity: 0.65,
  },
  googleIconWrapper: {
    marginRight: spacing.md,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
});
