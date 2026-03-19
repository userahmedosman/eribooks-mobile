import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { setProduct } from '../../src/lib/features/product/productSlice';
import { checkAuth } from '../../src/lib/features/auth/authSlice';
import { api } from '../../src/lib/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const products = useSelector((state) => state.product.list);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await api.products.getAll({ page: 1, pageSize: 20 });
      const items = data?.data || data?.content || data?.items || data?.$values || (Array.isArray(data) ? data : []);
      dispatch(setProduct(Array.isArray(items) ? items : []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(checkAuth());
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const getImageUrl = (product) => {
    const url = product?.book?.coverImageUrl || product?.coverImageUrl || product?.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const renderProduct = ({ item, index }) => {
    const imageUrl = getImageUrl(item);
    const title = item?.book?.title || item?.title || 'Untitled';
    const authors = item?.book?.authors?.map((a) => a.name).join(', ') || item?.author || '';
    const price = item?.price != null ? `$${item.price.toFixed(2)}` : 'Free';

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/book/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>📖</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>{title}</Text>
          {authors ? <Text style={styles.productAuthor} numberOfLines={1}>{authors}</Text> : null}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{price}</Text>
            <View style={styles.buyButtonSmall}>
              <Text style={styles.buyButtonSmallText}>Buy</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const featuredProducts = products.length > 0 ? products.slice(0, 2) : [];

    return (
      <View style={styles.header}>
        <View style={styles.greetingHeader}>
          <View>
            <Text style={styles.subtitle}>
              {isAuthenticated ? 'Welcome back,' : 'Good morning,'}
            </Text>
            <Text style={styles.greeting}>
              {isAuthenticated ? `${user?.firstName || 'Reader'}` : 'Guest'}
            </Text>
          </View>
          <TouchableOpacity style={styles.searchIconBtn} onPress={() => router.push('/search')}>
            <Text style={{ fontSize: 24 }}>🔍</Text>
          </TouchableOpacity>
        </View>

        {featuredProducts.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.sectionHeader}>Featured</Text>
            <View style={styles.featuredContainer}>
              {featuredProducts.map((featuredProduct) => (
                <TouchableOpacity
                  key={featuredProduct.id}
                  style={styles.featuredCard}
                  onPress={() => router.push(`/book/${featuredProduct.id}`)}
                  activeOpacity={0.9}
                >
                  <ImageBackground
                    source={{ uri: getImageUrl(featuredProduct) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop' }}
                    style={styles.featuredBackground}
                    imageStyle={{ borderRadius: borderRadius.xl }}
                  >
                    <View style={styles.featuredOverlay}>
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>Featured</Text>
                      </View>
                      <View>
                        <Text style={styles.featuredTitle} numberOfLines={2}>{featuredProduct?.book?.title || featuredProduct?.title || 'Untitled'}</Text>
                        <Text style={styles.featuredAuthor} numberOfLines={1}>{featuredProduct?.book?.authors?.map((a) => a.name).join(', ') || featuredProduct?.author || ''}</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {products.length > 2 && <Text style={styles.sectionHeader}>Trending Now</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Curating your library...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>😵</Text>
          <Text style={styles.errorText}>We couldn't load the books.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products.length > 2 ? products.slice(2) : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No books available right now.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  searchIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  featuredContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  featuredCard: {
    width: '48%',
    height: 320,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  featuredBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  featuredOverlay: {
    padding: spacing.md,
    backgroundColor: 'rgba(15, 15, 26, 0.7)',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  featuredBadge: {
    position: 'absolute',
    top: -180,
    left: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featuredBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
    fontSize: 14,
  },
  featuredAuthor: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.md,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceLight,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  productInfo: {
    padding: spacing.md,
  },
  productTitle: {
    ...typography.label,
    color: colors.text,
    fontSize: 15,
    marginBottom: 4,
  },
  productAuthor: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    ...typography.body,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  buyButtonSmall: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  buyButtonSmallText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  retryText: {
    ...typography.button,
    color: colors.text,
  },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
