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
import { 
  Search, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  ShoppingBag,
  AlertCircle,
  RefreshCcw
} from 'lucide-react-native';
import { setProduct } from '../../src/lib/features/product/productSlice';
import { checkAuth } from '../../src/lib/features/auth/authSlice';
import { api } from '../../src/lib/api';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const products = useSelector((state) => state.product.list);

  const colors = getColors(theme);
  const isDark = theme === 'dark';

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

  const renderProduct = ({ item }) => {
    const imageUrl = getImageUrl(item);
    const title = item?.book?.title || item?.title || 'Untitled';
    const authors = item?.book?.authors?.map((a) => a.name).join(', ') || item?.author || '';
    const price = item?.price != null ? `$${item.price.toFixed(2)}` : 'Free';

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/book/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.imageContainer, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <BookOpen size={48} color={colors.textMuted} />
            </View>
          )}
          {item.price === 0 && (
            <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.freeBadgeText}>{t('product.free', language)}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.productAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{authors || 'EriBooks Author'}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>{price}</Text>
            <View style={[styles.buyButtonSmall, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <ShoppingBag size={14} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.greetingHeader}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{t('home.title', language)}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home.subtitle', language)}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.searchIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => router.push('/search')}
          >
            <Search size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {products.length > 0 && (
          <View style={styles.sectionTitleRow}>
            <TrendingUp size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('home.trending', language)}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading', language)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{t('common.error', language)}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchProducts}>
            <RefreshCcw size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={[styles.retryText, { color: '#FFF' }]}>{t('common.retry', language)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.centered}>
            <BookOpen size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('home.empty', language)}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('home.emptySubtitle', language)}</Text>
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
    ...typography.bodySmall,
    marginTop: 2,
  },
  greeting: {
    ...typography.h1,
  },
  searchIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.h2,
    marginBottom: 0,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  row: {
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.sm,
  },
  imageContainer: {
    width: '100%',
    height: 220,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  productInfo: {
    padding: spacing.md,
  },
  productTitle: {
    ...typography.label,
    fontSize: 14,
    marginBottom: 2,
    textTransform: 'none',
  },
  productAuthor: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 16,
  },
  buyButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h3,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  retryText: {
    ...typography.button,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
