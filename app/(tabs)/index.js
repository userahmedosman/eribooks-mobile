import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  TrendingUp,
  BookOpen,
  Headphones,
  FileText,
  Package,
  AlertCircle,
  RefreshCcw,
  ChevronRight,
} from 'lucide-react-native';
import { setProduct } from '../../src/lib/features/product/productSlice';
import { checkAuth } from '../../src/lib/features/auth/authSlice';
import { api } from '../../src/lib/api';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

// productType: 0 = Bundle, 1 = eBook, 2 = Audiobook
const TYPE_CONFIG = {
  1: { label: 'eBook',     icon: FileText,    color: '#6366F1' },
  2: { label: 'Audiobook', icon: Headphones,  color: '#F59E0B' },
  0: { label: 'Bundle',    icon: Package,     color: '#10B981' },
};

const SECTIONS = [
  { key: 'ebooks',     title: 'eBooks',     types: [1], icon: FileText,   color: '#6366F1' },
  { key: 'audiobooks', title: 'Audiobooks', types: [2], icon: Headphones, color: '#F59E0B' },
  { key: 'bundles',    title: 'Bundles',    types: [0], icon: Package,    color: '#10B981' },
];

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const products = useSelector((state) => state.product.list);

  const colors = getColors(theme);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await api.products.getAll({ page: 1, pageSize: 50 });
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

  const ProductCard = ({ item }) => {
    const imageUrl = getImageUrl(item);
    const title = item?.book?.title || item?.title || 'Untitled';
    const authors = item?.book?.authors?.map((a) => a.name).join(', ') || item?.author || '';
    const isFree = item?.isFree || item?.IsFree || Number(item?.price) === 0;
    const priceLabel = isFree ? 'Free' : `$${Number(item?.price || 0).toFixed(2)}`;
    const typeConf = TYPE_CONFIG[item?.productType] || TYPE_CONFIG[1];
    const TypeIcon = typeConf.icon;

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/book/${item.id}`)}
        activeOpacity={0.8}
      >
        {/* Cover */}
        <View style={[styles.imageContainer, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <TypeIcon size={40} color={colors.textMuted} />
            </View>
          )}

          {/* Badges row – top-right */}
          <View style={styles.badgesRow}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
              <TypeIcon size={9} color="#FFF" />
              <Text style={styles.typeBadgeText}>{typeConf.label}</Text>
            </View>

            {/* Free badge */}
            {isFree && (
              <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.productAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {authors || 'EriBooks Author'}
          </Text>
          <Text style={[styles.productPrice, { color: isFree ? colors.success : colors.primary }]}>
            {priceLabel}
          </Text>
        </View>
      </TouchableOpacity>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* ── Header ── */}
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
        </View>

        {/* ── Sections by type ── */}
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          const sectionItems = products.filter((p) => section.types.includes(p.productType));
          if (sectionItems.length === 0) return null;

          // Pair items into rows of 2
          const rows = [];
          for (let i = 0; i < sectionItems.length; i += 2) {
            rows.push(sectionItems.slice(i, i + 2));
          }

          return (
            <View key={section.key} style={styles.section}>
              {/* Section header */}
              <View style={[styles.sectionTitleRow, { paddingHorizontal: spacing.lg }]}>
                <View style={[styles.sectionIconBox, { backgroundColor: section.color + '20' }]}>
                  <SectionIcon size={16} color={section.color} />
                </View>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>{section.title}</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.countText, { color: colors.textMuted }]}>{sectionItems.length}</Text>
                </View>
              </View>

              {/* Grid rows */}
              {rows.map((row, idx) => (
                <View key={idx} style={styles.row}>
                  {row.map((item) => <ProductCard key={String(item.id)} item={item} />)}
                  {/* Spacer if odd row */}
                  {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
                </View>
              ))}
            </View>
          );
        })}

        {products.length === 0 && (
          <View style={styles.centered}>
            <BookOpen size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('home.empty', language)}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  loadingText:  { ...typography.body, marginTop: spacing.md },
  errorText:    { ...typography.h3, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  retryButton:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, ...shadows.md },
  retryText:    { ...typography.button },
  emptyText:    { ...typography.body, marginTop: spacing.md, textAlign: 'center' },

  // Header
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  greetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  greeting:    { ...typography.h1 },
  subtitle:    { ...typography.bodySmall, marginTop: 2 },
  searchIconBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Sections
  section: { marginBottom: spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionIconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { ...typography.h2, marginBottom: 0, flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  countText:  { ...typography.caption, fontWeight: '700', fontSize: 11 },

  // Grid
  row: { flexDirection: 'row', paddingHorizontal: spacing.lg, justifyContent: 'space-between', marginBottom: spacing.md },
  productCard: { width: CARD_WIDTH, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, ...shadows.sm },
  imageContainer: { width: '100%', height: 200 },
  coverImage: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Badges
  badgesRow: { position: 'absolute', top: 8, right: 8, gap: 4, alignItems: 'flex-end' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  freeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  freeBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  // Product Info
  productInfo: { padding: spacing.md },
  productTitle: { ...typography.label, fontSize: 13, marginBottom: 2, textTransform: 'none' },
  productAuthor: { ...typography.caption, fontSize: 11, marginBottom: spacing.xs },
  productPrice: { ...typography.body, fontWeight: '800', fontSize: 15 },
});
