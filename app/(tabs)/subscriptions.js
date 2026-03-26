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
  Star,
  HelpCircle,
} from 'lucide-react-native';
import { fetchSubscriptionPlans, fetchUserSubscriptions, purchaseSubscription, confirmNewPayment, clearPurchaseState } from '../../src/lib/features/subscription/subscriptionSlice';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../../src/i18n';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export default function SubscriptionsScreen() {
  const dispatch = useDispatch();
  const { plans, plansLoading, plansError, userSubscriptions, purchaseLoading, purchaseError, purchaseResponse } = useSelector((state) => state.subscriptions);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchUserSubscriptions(user.id));
    }
  }, [dispatch, isAuthenticated, user]);

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      Alert.alert(t('common.error', language), t('settings.login', language));
      return;
    }

    try {
      const returnUrl = Linking.createURL('/subscriptions/success');
      const cancelUrl = Linking.createURL('/subscriptions');

      const purchaseData = {
        customerId: user.id,
        subscriptionPlanId: plan.id,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      };

      const result = await dispatch(purchaseSubscription(purchaseData)).unwrap();

      if (result?.paypalApprovalUrl) {
        // Use openAuthSessionAsync so the browser auto-closes when PayPal redirects back
        const browserResult = await WebBrowser.openAuthSessionAsync(result.paypalApprovalUrl, returnUrl);

        if (browserResult.type === 'success') {
          // Confirm payment on backend with the PayPal subscription ID
          try {
            await dispatch(confirmNewPayment({
              customerId: user.id,
              subscriptionPlanId: plan.id,
              paypalSubscriptionId: result.paypalSubscriptionId,
            })).unwrap();
          } catch (confirmError) {
            console.warn('Payment confirmation warning:', confirmError);
          }

          Alert.alert('Success', 'Subscription activated successfully!');

          if (user?.id) {
            dispatch(fetchUserSubscriptions(user.id));
          }
        } else {
          // User closed the browser without completing payment — do nothing
          console.log('Subscription payment was cancelled or dismissed.');
        }
      } else if (result?.subscriptionId) {
        Alert.alert('Success', 'Subscription activated!');
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to initiate purchase');
    }
  };

  const PlanButton = ({ item }) => {
    // Check if this plan is the user's active one
    const activeSub = userSubscriptions.find(sub =>
      sub.isActive &&
      (String(sub.planId) === String(item.id) ||
        String(sub.planName).toLowerCase() === String(item.name).toLowerCase())
    );

    // Fallback to user.subscription if userSubscriptions is empty
    const isActivePlan = !!activeSub || (
      user?.subscription &&
      (String(user.subscription.planId) === String(item.id) ||
        String(user.subscription.name).toLowerCase() === String(item.name).toLowerCase())
    );

    return (
      <TouchableOpacity
        style={[
          styles.subscribeButton,
          { backgroundColor: isActivePlan ? colors.success + '20' : colors.primary, borderColor: isActivePlan ? colors.success : 'transparent', borderWidth: isActivePlan ? 1 : 0 }
        ]}
        onPress={() => !isActivePlan && handleSubscribe(item)}
        disabled={isActivePlan || purchaseLoading}
      >
        {purchaseLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={[styles.buttonText, { color: isActivePlan ? colors.success : '#FFF' }]}>
            {isActivePlan
              ? 'Active'
              : isAuthenticated ? t('subscriptions.choosePlan', language) : t('settings.login', language)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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

      <PlanButton item={item} />

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
            <HelpCircle size={20} color={colors.primary} style={{ marginRight: 10 }} />
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
