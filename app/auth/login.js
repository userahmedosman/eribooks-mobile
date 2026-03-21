import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  BookOpen,
  Chrome,
  AlertCircle
} from 'lucide-react-native';
import { getColors, spacing, borderRadius, typography } from '../../src/theme';
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
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // Use the same client ID
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
      promptAsync();
      return;
    }

    // Native flow (since we are now in a Dev Client)
    try {
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
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
      // Fallback to browser flow if native fails for some reason
      promptAsync();
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
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.white10 }]}
            onPress={handleClose}
          >
            <X size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                <BookOpen size={48} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: '#FFF' }]}>EriBooks</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                {t('home.subtitle', language)}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface + 'CC', borderColor: colors.border }]}>
              <Text style={[styles.welcomeText, { color: '#FFF' }]}>{t('settings.login', language)}</Text>
              <Text style={[styles.signInText, { color: 'rgba(255,255,255,0.6)' }]}>{t('auth.signInDesc', language) || 'Sign in to access your library'}</Text>

              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
                  <AlertCircle size={16} color={colors.error} style={{ marginRight: 8 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: '#FFF' }, loading && styles.googleButtonDisabled]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <View style={styles.googleIconWrapper}>
                      <Chrome size={20} color="#000" />
                    </View>
                    <Text style={[styles.googleButtonText, { color: '#000' }]}>{t('auth.google', language) || 'Continue with Google'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.termsText, { color: 'rgba(255,255,255,0.5)' }]}>
                {t('auth.termsPrompt', language) || 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
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
    backgroundColor: 'rgba(15, 15, 26, 0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.xl,
  },
  welcomeText: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  signInText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIconWrapper: {
    marginRight: spacing.md,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F0F1A',
  },
  termsText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});

