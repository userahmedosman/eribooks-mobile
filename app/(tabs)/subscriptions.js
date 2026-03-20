import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Check, 
  Zap, 
  Shield, 
  Globe, 
  Clock, 
  CreditCard,
  ChevronRight,
  TrendingUp,
  Star
} from 'lucide-react-native';
import { fetchSubscriptionPlans } from '../../src/lib/features/subscription/subscriptionSlice';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../../src/i18n';

export default function SubscriptionsScreen() {
  const dispatch = useDispatch();
  const { plans, plansLoading, plansError } = useSelector((state) => state.subscriptions);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  const renderPlan = ({ item }) => (
    <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.planHeader}>
        <View>
          <Text style={[styles.planName, { color: colors.text }]}>{item.name}</Text>
          {item.isPopular && (
            <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
              <Star size={10} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.popularText}>{t('subscriptions.popular', language)}</Text>
            </View>
          )}
        </View>
        <Zap size={24} color={item.isPopular ? colors.primary : colors.textMuted} />
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.planPrice, { color: colors.text }]}>
          <Text style={styles.currency}>$</Text>
          {item.price}
        </Text>
        <Text style={[styles.period, { color: colors.textSecondary }]}>
          /{item.interval === 1 ? t('subscriptions.monthly', language) : t('subscriptions.yearly', language)}
        </Text>
      </View>
      
      <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
        {item.description || 'Access to premium books and exclusive content.'}
      </Text>

      <TouchableOpacity 
        style={[
          styles.subscribeButton, 
          { backgroundColor: colors.primary }
        ]}
        onPress={() => console.log('Subscribe to', item.name)}
      >
        <Text style={styles.buttonText}>
          {isAuthenticated ? t('subscriptions.choosePlan', language) : t('settings.login', language)}
        </Text>
      </TouchableOpacity>

      <View style={styles.featuresList}>
        {(item.features || ['Unlimited Reading', 'Offline Access', 'Exclusive Content']).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={[styles.checkCircle, { backgroundColor: colors.success + '20' }]}>
              <Check size={12} color={colors.success} />
            </View>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (plansLoading && plans.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('subscriptions.title', language)}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('subscriptions.subtitle', language)}
          </Text>
        </View>

        {plansLoading && plans.length === 0 && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {plansError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{plansError}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary + '10' }]} 
              onPress={() => dispatch(fetchSubscriptionPlans())}
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>{t('common.retry', language)}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <React.Fragment key={plan.id}>
              {renderPlan({ item: plan })}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.faqSection}>
          <Text style={[styles.faqHeader, { color: colors.text }]}>
            <HelpCircle size={20} color={colors.primary} style={{ marginRight: 8 }} />
            {t('subscriptions.faqTitle', language)}
          </Text>
          
          <View style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.question, { color: colors.text }]}>{t('subscriptions.faq1_q', language)}</Text>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('subscriptions.faq1_a', language)}</Text>
          </View>
          
          <View style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.question, { color: colors.text }]}>{t('subscriptions.faq2_q', language)}</Text>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('subscriptions.faq2_a', language)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    padding: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    opacity: 0.8,
  },
  plansContainer: {
    paddingHorizontal: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: '800',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: 6,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  currency: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 2,
  },
  period: {
    ...typography.body,
    marginLeft: 4,
    fontWeight: '600',
  },
  planDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  subscribeButton: {
    height: 54,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  buttonText: {
    color: '#FFF',
    ...typography.button,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  faqSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  faqHeader: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqItem: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  question: {
    ...typography.label,
    fontSize: 15,
    marginBottom: 6,
    textTransform: 'none',
  },
  answer: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  retryText: {
    ...typography.button,
    fontSize: 14,
  },
});
