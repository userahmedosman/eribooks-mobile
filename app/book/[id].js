import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../src/lib/features/cart/cartSlice';
import { api } from '../../src/lib/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.products.getById(id);
        const rawData = response?.data || response?.content || response?.item || response;
        let productData = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!productData?.book) {
          const allRes = await api.products.getAll();
          const allItems = allRes?.data || allRes?.content || allRes?.items || allRes?.$values || (Array.isArray(allRes) ? allRes : []);
          const found = allItems.find((p) => String(p.id) === String(id));
          if (found) productData = found;
        }

        setProduct(productData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 48 }}>😵</Text>
        <Text style={styles.errorText}>{error || 'Book not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const book = product.book || {};
  const title = book.title || product.title || 'Untitled';
  const authors = book.authors?.map((a) => a.name).join(', ') || '';
  const description = book.description || product.description || 'No description available.';
  const price = product.price != null ? `$${product.price.toFixed(2)}` : 'Free';
  const rating = product.rating || product.averageRating;
  const reviews = book.reviews || [];

  const imageUrl = (() => {
    const url = book.coverImageUrl || product.coverImageUrl || product.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  })();

  const handleAddToCart = () => {
    dispatch(addToCart({ productId: String(product.id) }));
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    dispatch(addToCart({ productId: String(product.id) }));
    router.push('/cart');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Image */}
        <View style={styles.imageSection}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: 72 }}>📖</Text>
            </View>
          )}
        </View>

        {/* Book Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{title}</Text>
          {authors ? <Text style={styles.authors}>by {authors}</Text> : null}

          {/* Rating */}
          {rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>
                {'⭐'.repeat(Math.round(rating))}
              </Text>
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
              {reviews.length > 0 && (
                <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
              )}
            </View>
          )}

          <Text style={styles.price}>{price}</Text>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {/* Reviews preview */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
              {reviews.slice(0, 3).map((review, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.reviewerName || 'Anonymous'}</Text>
                    <Text style={styles.reviewRating}>
                      {'⭐'.repeat(review.rating || 0)}
                    </Text>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={3}>
                    {review.content || review.comment}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  retryText: {
    ...typography.button,
    color: colors.text,
  },
  imageSection: {
    height: 320,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '60%',
    height: '90%',
    borderRadius: borderRadius.md,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  authors: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingStars: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  ratingText: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  reviewCount: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  price: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  reviewsSection: {
    marginBottom: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    ...typography.label,
    color: colors.text,
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  addToCartButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addToCartText: {
    ...typography.button,
    color: colors.primary,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buyNowText: {
    ...typography.button,
    color: colors.text,
  },
});
