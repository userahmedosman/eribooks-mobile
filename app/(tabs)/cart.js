import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, deleteItemFromCart, clearCart, addToCart } from '../../src/lib/features/cart/cartSlice';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

export default function CartScreen() {
  const dispatch = useDispatch();
  const { cartItems, total } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);

  const cartProducts = Object.entries(cartItems).map(([productId, quantity]) => {
    const product = products.find((p) => String(p.id) === productId) || { id: productId };
    return { ...product, quantity };
  });

  const renderCartItem = ({ item }) => {
    const title = item?.book?.title || item?.title || `Product #${item.id}`;
    const price = item?.price || 0;

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.itemPrice}>${(price * item.quantity).toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => dispatch(removeFromCart({ productId: String(item.id) }))}
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => dispatch(addToCart({ productId: String(item.id) }))}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => dispatch(deleteItemFromCart({ productId: String(item.id) }))}
          >
            <Text style={{ fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalPrice = cartProducts.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Cart</Text>
        {cartProducts.length > 0 && (
          <TouchableOpacity onPress={() => dispatch(clearCart())}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartProducts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Browse books and add them to your cart</Text>
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
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
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
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  cartItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  itemTitle: {
    ...typography.label,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemPrice: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  qtyText: {
    ...typography.body,
    color: colors.text,
    marginHorizontal: spacing.md,
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkoutText: {
    ...typography.button,
    color: colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
