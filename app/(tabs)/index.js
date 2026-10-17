import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  BookOpen,
  Headphones,
  FileText,
  Package,
  AlertCircle,
  RefreshCcw,
  Sparkles,
  Crown,
  ChevronRight,
  User as UserIcon,
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
  1: { label: 'eBook',     icon: FileText,   color: '#4d62cd', bg: 'rgba(77, 98, 205, 0.15)' },
  2: { label: 'Audiobook', icon: Headphones, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  0: { label: 'Bundle',    icon: Package,    color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
};

const SECTIONS = [
  { key: 'ebooks',     title: 'eBooks',     types: [1], icon: FileText,   color: '#4d62cd' },
  { key: 'audiobooks', title: 'Audiobooks', types: [2], icon: Headphones, color: '#f59e0b' },
  { key: 'bundles',    title: 'Bundles',    types: [0], icon: Package,    color: '#10b981' },
];

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const products = useSelector((state) => state.product.list || []);

  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'ebooks', 'audiobooks', 'bundles'

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

  // Filter products based on active category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'ebooks') return products.filter((p) => p.productType === 1);
    if (activeCategory === 'audiobooks') return products.filter((p) => p.productType === 2);
    if (activeCategory === 'bundles') return products.filter((p) => p.productType === 0);
    return products;
  }, [products, activeCategory]);

  const featuredBook = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products[0];
  }, [products]);

  const ProductCard = ({ item }) => {
    const imageUrl = getImageUrl(item);
    const title = item?.book?.title || item?.title || 'Untitled';
    const authors = item?.book?.authors?.map((a) => a.name).join(', ') || item?.author || '';
    const isFree = item?.isFree || item?.IsFree || Number(item?.price) === 0;
    const typeConf = TYPE_CONFIG[item?.productType] || TYPE_CONFIG[1];
    const TypeIcon = typeConf.icon;

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
          }
        ]}
        onPress={() => router.push(`/book/${item.id}`)}
        activeOpacity={0.85}
      >
        {/* Cover Image Container */}
        <View style={[styles.imageContainer, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <TypeIcon size={36} color={colors.textMuted} />
            </View>
          )}

          {/* Badges Overlay */}
          <View style={styles.badgesRow}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
              <TypeIcon size={10} color="#FFF" strokeWidth={2.4} />
              <Text style={styles.typeBadgeText}>{typeConf.label}</Text>
            </View>

            {/* Free or VIP badge */}
            {isFree ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.statusBadgeText}>FREE</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.gold }]}>
                <Crown size={9} color="#FFF" strokeWidth={2.5} style={{ marginRight: 2 }} />
                <Text style={styles.statusBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.productAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {authors || 'EriBooks Author'}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: isFree ? colors.success : colors.primaryLight }]}>
              {isFree ? 'Free Access' : 'Subscription'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Image 
            source={require('../../assets/eri_books_logo.png')} 
            style={styles.loadingLogo} 
            resizeMode="contain" 
          />
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading', language)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AlertCircle size={56} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{t('common.error', language)}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchProducts}>
            <RefreshCcw size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={[styles.retryText, { color: '#FFF' }]}>{t('common.retry', language)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary} 
            colors={[colors.primary]} 
          />
        }
      >
        {/* ── Modern Branded Header with Official EriBooks Logo ── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIdentity}>
              <View style={[styles.logoContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Image 
                  source={require('../../assets/eri_books_logo.png')} 
                  style={styles.headerLogo} 
                  resizeMode="contain" 
                />
              </View>
              <View style={styles.brandTextGroup}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.brandTitle, { color: colors.text }]}>EriBooks</Text>
                  <View style={[styles.brandDot, { backgroundColor: colors.gold }]} />
                </View>
                <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
                  {t('home.subtitle', language) || 'Read • Listen • Explore'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push('/search')}
                accessibilityLabel="Search"
              >
                <Search size={20} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(isAuthenticated ? '/(tabs)/settings' : '/auth/login')}
                accessibilityLabel="Profile"
              >
                {isAuthenticated ? (
                  <View style={[styles.avatarMini, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarMiniText}>
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                ) : (
                  <UserIcon size={20} color={colors.text} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Featured Hero Card ── */}
        {featuredBook && (
          <TouchableOpacity 
            style={[styles.featuredHero, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}
            onPress={() => router.push(`/book/${featuredBook.id}`)}
            activeOpacity={0.9}
          >
            <View style={styles.featuredBadgeRow}>
              <View style={[styles.featuredPill, { backgroundColor: colors.goldGlow, borderColor: colors.gold }]}>
                <Sparkles size={13} color={colors.gold} style={{ marginRight: 4 }} />
                <Text style={[styles.featuredPillText, { color: colors.gold }]}>FEATURED PICK</Text>
              </View>
              <View style={styles.featuredArrow}>
                <Text style={[styles.exploreText, { color: colors.primaryLight }]}>Explore</Text>
                <ChevronRight size={14} color={colors.primaryLight} />
              </View>
            </View>

            <View style={styles.featuredBody}>
              <View style={styles.featuredCoverWrapper}>
                {getImageUrl(featuredBook) ? (
                  <Image source={{ uri: getImageUrl(featuredBook) }} style={styles.featuredCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.featuredCoverPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                    <BookOpen size={28} color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.featuredMeta}>
                <Text style={[styles.featuredTitle, { color: colors.text }]} numberOfLines={2}>
                  {featuredBook?.book?.title || featuredBook?.title || 'EriBooks Premium Selection'}
                </Text>
                <Text style={[styles.featuredAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                  {featuredBook?.book?.authors?.map((a) => a.name).join(', ') || 'Featured Author'}
                </Text>
                <Text style={[styles.featuredDescription, { color: colors.textMuted }]} numberOfLines={2}>
                  {featuredBook?.book?.description || 'Immerse yourself in authentic literature, audiobooks, and stories.'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Filter Pills ── */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'ebooks', label: 'eBooks' },
              { id: 'audiobooks', label: 'Audiobooks' },
              { id: 'bundles', label: 'Bundles' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#FFF' : colors.textSecondary, fontWeight: isActive ? '700' : '500' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Sectioned / Filtered Book Content ── */}
        {activeCategory === 'all' ? (
          SECTIONS.map((section) => {
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
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: section.color + '20' }]}>
                    <SectionIcon size={16} color={section.color} />
                  </View>
                  <Text style={[styles.sectionHeader, { color: colors.text }]}>{section.title}</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.countText, { color: colors.textSecondary }]}>{sectionItems.length}</Text>
                  </View>
                </View>

                {/* Grid rows */}
                {rows.map((row, idx) => (
                  <View key={idx} style={styles.row}>
                    {row.map((item) => <ProductCard key={String(item.id)} item={item} />)}
                    {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
                  </View>
                ))}
              </View>
            );
          })
        ) : (
          <View style={styles.section}>
            {/* Filtered view items */}
            {filteredProducts.length > 0 ? (
              Array.from({ length: Math.ceil(filteredProducts.length / 2) }).map((_, idx) => {
                const row = filteredProducts.slice(idx * 2, idx * 2 + 2);
                return (
                  <View key={idx} style={styles.row}>
                    {row.map((item) => <ProductCard key={String(item.id)} item={item} />)}
                    {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCategory}>
                <Text style={[styles.emptyCategoryText, { color: colors.textSecondary }]}>
                  No items found in this category.
                </Text>
              </View>
            )}
          </View>
        )}

        {products.length === 0 && (
          <View style={styles.centered}>
            <BookOpen size={56} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('home.empty', language)}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  loadingLogo: { width: 72, height: 72 },
  loadingText: { ...typography.body, marginTop: spacing.md },
  errorText: { ...typography.h3, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  retryText: { ...typography.button },
  emptyText: { ...typography.body, marginTop: spacing.md, textAlign: 'center' },

  // Branded Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    ...shadows.sm,
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  brandTextGroup: {
    marginLeft: spacing.sm + 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarMini: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Featured Hero Card
  featuredHero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.md,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  featuredPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  featuredArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featuredCoverWrapper: {
    width: 72,
    height: 98,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  featuredCover: {
    width: '100%',
    height: '100%',
  },
  featuredCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredMeta: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  featuredAuthor: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 11,
    lineHeight: 16,
  },

  // Filter Bar
  filterBar: {
    marginBottom: spacing.md,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    ...typography.h2,
    fontSize: 20,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Grid
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.sm,
  },
  imageContainer: {
    width: '100%',
    height: 195,
    position: 'relative',
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

  // Badges
  badgesRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
    alignItems: 'flex-end',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  // Product Info
  productInfo: {
    padding: spacing.sm + 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 2,
  },
  productAuthor: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCategory: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
  },
});
