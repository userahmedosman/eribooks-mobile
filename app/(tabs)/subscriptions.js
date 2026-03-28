import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Check,
  Zap,
  Star,
  HelpCircle,
  AlertCircle,
  XCircle,
  Crown,
  Calendar,
} from 'lucide-react-native';
import {
  fetchSubscriptionPlans,
  fetchUserSubscriptions,
  purchaseSubscription,
  confirmNewPayment,
  cancelSubscription,
  clearPurchaseState,
  clearErrors,
} from '../../src/lib/features/subscription/subscriptionSlice';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../../src/i18n';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Map backend error codes to user-friendly messages
const ERROR_MESSAGES = {
  DUPLICATE_PLAN_SUBSCRIPTION:
    'You already have an active subscription to this plan. Cancel it first to subscribe again.',
  ACTIVE_SUBSCRIPTION_EXISTS:
    'You can only have one active subscription at a time. Cancel your current plan before switching.',
  INVALID_PLAN: 'This subscription plan is no longer available.',
  PAYPAL_NOT_ACTIVE: 'Payment was not approved by PayPal. Please try again.',
};

function resolveErrorMessage(rawMessage) {
  if (!rawMessage) return 'Failed to process subscription. Please try again.';
  // Check if the raw message contains one of the known error codes
  for (const [code, msg] of Object.entries(ERROR_MESSAGES)) {
    if (rawMessage.includes(code)) return msg;
  }
  return rawMessage;
}

export default function SubscriptionsScreen() {
  const dispatch = useDispatch();
  const {
    plans,
    plansLoading,
    plansError,
    userSubscriptions,
    purchaseLoading,
    purchaseError,
    cancelLoading,
    cancelError,
  } = useSelector((state) => state.subscriptions);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);

  // Derive active subscription once
  const activeSubscription = userSubscriptions.find((s) => s.isActive) ?? null;

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchUserSubscriptions(user.id));
    }
  }, [dispatch, isAuthenticated, user]);

  // Clear stale errors when the screen mounts
  useEffect(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // ─── Subscribe Handler ────────────────────────────────────────────────────
  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      Alert.alert(t('common.error', language), t('settings.login', language));
      return;
    }

    try {
      dispatch(clearPurchaseState());
      const returnUrl = Linking.createURL('/subscriptions/success');
      const cancelUrl = Linking.createURL('/subscriptions');

      const result = await dispatch(
        purchaseSubscription({
          customerId: user.id,
          subscriptionPlanId: plan.id,
          returnUrl,
          cancelUrl,
        })
      ).unwrap();

      if (result?.paypalApprovalUrl) {
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.paypalApprovalUrl,
          returnUrl
        );

        if (browserResult.type === 'success') {
          try {
            await dispatch(
              confirmNewPayment({
                customerId: user.id,
                subscriptionPlanId: plan.id,
                paypalSubscriptionId: result.paypalSubscriptionId,
              })
            ).unwrap();
          } catch (confirmError) {
            console.warn('Payment confirmation warning:', confirmError);
          }

          Alert.alert('Success 🎉', 'Subscription activated successfully!');
          if (user?.id) dispatch(fetchUserSubscriptions(user.id));
        } else {
          console.log('Subscription payment was cancelled or dismissed.');
        }
      } else if (result?.subscriptionId) {
        Alert.alert('Success 🎉', 'Subscription activated!');
        if (user?.id) dispatch(fetchUserSubscriptions(user.id));
      }
    } catch (error) {
      // Error is already stored in purchaseError state — also show Alert
      Alert.alert('Subscription Error', resolveErrorMessage(error));
    }
  };

  // ─── Cancel Handler ───────────────────────────────────────────────────────
  const handleCancel = (subscriptionId) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure? You will lose access to premium content immediately.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelSubscription({ subscriptionId })).unwrap();
              Alert.alert('Done', 'Your subscription has been cancelled.');
              if (user?.id) dispatch(fetchUserSubscriptions(user.id));
            } catch (err) {
              Alert.alert('Error', err || 'Failed to cancel subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ─── Plan Button ──────────────────────────────────────────────────────────
  const PlanButton = ({ item }) => {
    const isThisPlanActive =
      !!activeSubscription &&
      (String(activeSubscription.planId) === String(item.id) ||
        String(activeSubscription.planName).toLowerCase() === String(item.name).toLowerCase());

    const hasAnyActivePlan = !!activeSubscription;
    const isDisabled = hasAnyActivePlan || purchaseLoading;

    let buttonLabel;
    if (purchaseLoading) {
      buttonLabel = null; // show spinner
    } else if (isThisPlanActive) {
      buttonLabel = '✓ Current Plan';
    } else if (hasAnyActivePlan) {
      buttonLabel = 'Cancel to Switch';
    } else if (isAuthenticated) {
      buttonLabel = t('subscriptions.choosePlan', language);
    } else {
      buttonLabel = t('settings.login', language);
    }

    const buttonBg = isThisPlanActive
      ? colors.success + '25'
      : hasAnyActivePlan
      ? colors.surfaceLight || colors.surface
      : colors.primary;

    const buttonBorder = isThisPlanActive
      ? colors.success
      : hasAnyActivePlan
      ? colors.border
      : 'transparent';

    const textColor = isThisPlanActive
      ? colors.success
      : hasAnyActivePlan
      ? colors.textMuted
      : '#FFF';

    return (
      <TouchableOpacity
        style={[
          styles.subscribeButton,
          { backgroundColor: buttonBg, borderColor: buttonBorder, borderWidth: 1 },
        ]}
        onPress={() => !isDisabled && handleSubscribe(item)}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 1 : 0.8}
      >
        {purchaseLoading && !hasAnyActivePlan ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={[styles.buttonText, { color: textColor }]}>{buttonLabel}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Active Subscription Banner ───────────────────────────────────────────
  const ActivePlanBanner = () => {
    if (!activeSubscription) return null;

    const startDate = activeSubscription.startDate
      ? new Date(activeSubscription.startDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;

    return (
      <View style={[styles.activeBanner, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
        <View style={styles.bannerRow}>
          <View style={[styles.bannerIconCircle, { backgroundColor: colors.success + '25' }]}>
            <Crown size={20} color={colors.success} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={[styles.bannerTitle, { color: colors.success }]}>
              Active Plan: {activeSubscription.planName}
            </Text>
            {startDate && (
              <View style={styles.bannerDateRow}>
                <Calendar size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.bannerDate, { color: colors.textMuted }]}>
                  Since {startDate}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.bannerNote, { color: colors.textSecondary }]}>
          To switch to a different plan, cancel your current subscription first.
        </Text>

        {cancelError && (
          <Text style={[styles.cancelErrorText, { color: colors.error }]}>
            {resolveErrorMessage(cancelError)}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.error + '80' }]}
          onPress={() => handleCancel(activeSubscription.id)}
          disabled={cancelLoading}
        >
          {cancelLoading ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <XCircle size={16} color={colors.error} style={{ marginRight: 6 }} />
              <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                Cancel Subscription
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Plan Card ────────────────────────────────────────────────────────────
  const renderPlan = ({ item }) => {
    const isThisPlanActive =
      !!activeSubscription &&
      (String(activeSubscription.planId) === String(item.id) ||
        String(activeSubscription.planName).toLowerCase() === String(item.name).toLowerCase());

    return (
      <View
        style={[
          styles.planCard,
          {
            backgroundColor: colors.surface,
            borderColor: isThisPlanActive ? colors.success + '60' : colors.border,
            borderWidth: isThisPlanActive ? 2 : 1,
            opacity: activeSubscription && !isThisPlanActive ? 0.65 : 1,
          },
        ]}
      >
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
          {(item.features || ['Unlimited Reading', 'Offline Access', 'Exclusive Content']).map(
            (feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success + '20' }]}>
                  <Check size={12} color={colors.success} />
                </View>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
              </View>
            )
          )}
        </View>
      </View>
    );
  };

  // ─── Rendering ────────────────────────────────────────────────────────────
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('subscriptions.title', language)}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('subscriptions.subtitle', language)}
          </Text>
        </View>

        {/* Inline purchase error (e.g., from Redux state after server rejects) */}
        {purchaseError && (
          <View style={[styles.purchaseErrorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <AlertCircle size={16} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.purchaseErrorText, { color: colors.error }]}>
              {resolveErrorMessage(purchaseError)}
            </Text>
          </View>
        )}

        {/* Active subscription banner */}
        <View style={styles.bannerContainer}>
          <ActivePlanBanner />
        </View>

        {/* Plans error */}
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

        {/* Plan cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <React.Fragment key={plan.id}>{renderPlan({ item: plan })}</React.Fragment>
          ))}
        </View>

        {/* FAQ */}
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
  container: { flex: 1 },
  centered: { padding: spacing.xxl, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: spacing.xxl },

  // Header
  header: { padding: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.lg, opacity: 0.8 },

  // Purchase error box
  purchaseErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  purchaseErrorText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },

  // Active plan banner
  bannerContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  activeBanner: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: { flex: 1 },
  bannerTitle: { ...typography.label, fontSize: 15, textTransform: 'none' },
  bannerDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  bannerDate: { ...typography.caption, fontSize: 12 },
  bannerNote: { ...typography.bodySmall, lineHeight: 18, marginTop: spacing.xs },
  cancelErrorText: { ...typography.bodySmall },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  cancelButtonText: { ...typography.button, fontSize: 14 },

  // Plans
  plansContainer: { paddingHorizontal: spacing.lg },
  planCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: { ...typography.h3, fontSize: 22, fontWeight: '800' },
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
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  planPrice: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  currency: { fontSize: 20, fontWeight: '700', marginRight: 2 },
  period: { ...typography.body, marginLeft: 4, fontWeight: '600' },
  planDescription: { ...typography.bodySmall, marginBottom: spacing.xl, lineHeight: 20 },

  // Subscribe button
  subscribeButton: {
    height: 54,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  buttonText: { color: '#FFF', ...typography.button },

  // Features
  featuresList: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: { ...typography.bodySmall, fontWeight: '500' },

  // FAQ
  faqSection: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
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
  question: { ...typography.label, fontSize: 15, marginBottom: 6, textTransform: 'none' },
  answer: { ...typography.bodySmall, lineHeight: 18 },

  // Error
  errorContainer: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, textAlign: 'center', marginBottom: spacing.md },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  retryText: { ...typography.button, fontSize: 14 },
});
