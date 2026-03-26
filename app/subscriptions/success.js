import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, ArrowRight, Home } from 'lucide-react-native';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';
import { fetchUserSubscriptions } from '../../src/lib/features/subscription/subscriptionSlice';

export default function SubscriptionSuccessScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserSubscriptions(user.id));
    }
  }, [dispatch, user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
          <CheckCircle size={80} color={colors.success} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {t('subscriptions.successTitle', language) || 'Subscription Activated!'}
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('subscriptions.successSubtitle', language) || 'You now have full access to all premium content.'}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>{t('common.home', language) || 'Go to Home'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {t('common.back', language) || 'Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonText: {
    color: '#FFF',
    ...typography.button,
    fontSize: 16,
  },
  secondaryButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...typography.button,
    fontSize: 16,
  },
});
