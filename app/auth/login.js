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
import { loginWithGoogle, resetError, checkAuth } from '../../src/lib/features/auth/authSlice';
import { secureStorage } from '../../src/lib/security/dataProtection';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { colors, spacing, borderRadius, typography } from '../../src/theme';

// Required for web browser session
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);


  const handleGoogleLogin = async () => {
    try {
      const authUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/google-login?isNativeApp=true`;
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'eribooks',
        path: 'auth/callback'
      });

      console.log('Opening Auth Session:', authUrl);
      console.log('Expecting Redirect to:', redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        console.log('Auth Session Success:', result.url);
        const params = new URLSearchParams(result.url.split('?')[1]);
        const accessToken = params.get('accessToken') || params.get('token');
        const refreshToken = params.get('refreshToken');

        if (accessToken) {
          console.log('Backend tokens received via deep link');
          handleBackendTokens(accessToken, refreshToken);
        } else {
          console.warn('Success but no tokens in URL');
        }
      } else {
        console.log('Auth Session Result:', result.type);
      }
    } catch (error) {
      console.error('Google Login Error:', error);
    }
  };

  const handleBackendTokens = async (accessToken, refreshToken) => {
    try {
      if (accessToken) await secureStorage.setItem('accessToken', accessToken);
      if (refreshToken) await secureStorage.setItem('refreshToken', refreshToken);
      await secureStorage.setItem('isLoggedIn', 'true');
      
      await dispatch(checkAuth({ force: true }));
      router.back();
    } catch (err) {
      console.error('Error storing backend tokens:', err);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop' }}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Text style={{ fontSize: 64 }}>📚</Text>
              </View>
              <Text style={styles.title}>EriBooks</Text>
              <Text style={styles.subtitle}>Discover a world of knowledge</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.signInText}>Sign in to access your library</Text>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.googleButton, loading && styles.googleButtonDisabled]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <View style={styles.googleIconWrapper}>
                      <Text style={{ fontSize: 18 }}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <Text style={styles.termsText}>
                By signing in, you agree to our Terms of Service and Privacy Policy.
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
    backgroundColor: colors.background,
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
    color: colors.text,
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
    color: colors.text,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  signInText: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.error,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
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
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});

