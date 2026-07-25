import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  AlertCircle,
  ShoppingBasket
} from 'lucide-react-native';
import { removeFromCart, deleteItemFromCart, clearCart, addToCart } from '../../src/lib/features/cart/cartSlice';
import { api } from '../../src/lib/api';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

export default function CartScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { cartItems, total } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);
  const isDark = theme === 'dark';
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const cartProducts = Object.entries(cartItems).map(([productId, quantity]) => {
    const product = products.find((p) => String(p.id) === productId) || { id: productId };
    return { ...product, quantity };
  });

  const renderCartItem = ({ item }) => {
    const title = item?.book?.title || item?.title || `Product #${item.id}`;
    const price = item?.price || 0;

    return (
      <View style={[styles.cartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>${(price * item.quantity).toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          <View style={[styles.qtyControlGroup, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => dispatch(removeFromCart({ productId: String(item.id) }))}
            >
              <Minus size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => dispatch(addToCart({ productId: String(item.id) }))}
            >
              <Plus size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => dispatch(deleteItemFromCart({ productId: String(item.id) }))}
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalPrice = cartProducts.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const handleCheckout = async () => {
    if (cartProducts.length === 0) return;

    if (!isAuthenticated) {
      Alert.alert(
        t('common.error', language) || 'Sign In Required',
        'Please sign in to complete your checkout.',
        [
          { text: t('forms.cancel', language) || 'Cancel', style: 'cancel' },
          { text: t('settings.login', language) || 'Sign In', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    setCheckoutLoading(true);

    try {
      // Construct OrderItems with valid BookId > 0 as required by backend validation
      const orderItems = await Promise.all(
        cartProducts.map(async (item) => {
          let bId = Number(item.bookId || item.book?.id || 0);
          let pId = Number(item.id || 0);

          // If bookId is missing, fetch product details to retrieve bookId
          if (!bId && pId) {
            try {
              const res = await api.products.getById(pId);
              const fetched = res?.data || res?.content || res?.item || res;
              if (fetched) {
                bId = Number(fetched.bookId || fetched.book?.id || pId);
              }
            } catch (e) {
              console.warn('[Checkout] Failed to fetch product details for bookId:', e.message);
            }
          }

          // Fallback to pId if bId is still 0
          if (!bId) bId = pId;

          const qty = Number(item.quantity || 1);
          const prc = Number(item.price || 0);

          return {
            bookId: bId,
            BookId: bId,
            productId: pId,
            ProductId: pId,
            quantity: qty,
            Quantity: qty,
            unitPrice: prc,
            UnitPrice: prc,
            price: prc,
            Price: prc,
          };
        })
      );

      const orderPayload = {
        customerId: Number(user?.id || 0),
        CustomerId: Number(user?.id || 0),
        items: orderItems,
        orderItems: orderItems,
        OrderItems: orderItems,
        totalAmount: Number(totalPrice || 0),
        TotalAmount: Number(totalPrice || 0),
      };

      console.log('[Checkout] Submitting order payload:', JSON.stringify(orderPayload, null, 2));

      await api.orders.create(orderPayload);

      dispatch(clearCart());

      Alert.alert(
        'Order Placed 🎉',
        'Thank you for your order! Your purchase has been processed successfully.',
        [
          {
            text: 'View Profile',
            onPress: () => router.push('/(tabs)/profile'),
          },
          {
            text: 'Continue Shopping',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (err) {
      console.error('[Checkout Error]', err);
      Alert.alert(
        t('common.error', language) || 'Checkout Error',
        err.message || 'Failed to process checkout. Please try again.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('cart.title', language) || 'My Cart'}</Text>
        {cartProducts.length > 0 && (
          <TouchableOpacity onPress={() => dispatch(clearCart())}>
            <Text style={[styles.clearText, { color: colors.error }]}>{t('cart.clearAll', language) || 'Clear All'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartProducts.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
            <ShoppingBasket size={64} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('cart.empty', language) || 'Your cart is empty'}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t('cart.emptySubtitle', language) || 'Browse books and add them to your cart'}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartProducts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('subscriptions.total', language) || 'Total'}</Text>
              <Text style={[styles.totalPrice, { color: colors.text }]}>${totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
              onPress={handleCheckout}
              disabled={checkoutLoading}
              activeOpacity={0.8}
            >
              {checkoutLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.checkoutText}>{t('subscriptions.checkout', language) || 'Proceed to Checkout'}</Text>
                  <ArrowRight size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  screenTitle: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '800',
  },
  clearText: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 150,
  },
  cartItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  itemTitle: {
    ...typography.label,
    fontSize: 16,
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  itemPrice: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 4,
    height: 40,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    ...typography.body,
    marginHorizontal: spacing.lg,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: spacing.lg,
    ...shadows.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    ...typography.label,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalPrice: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: '900',
  },
  checkoutButton: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  checkoutText: {
    color: '#FFF',
    ...typography.button,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.6,
  },
});
