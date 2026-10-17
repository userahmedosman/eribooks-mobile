import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import {
  Search as SearchIcon,
  X,
  Book,
  BookOpen,
  Headphones,
  FileText,
  Package,
  Sparkles,
  ChevronRight,
  Crown,
} from 'lucide-react-native';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { api } from '../../src/lib/api';
import { t } from '../../src/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

const TYPE_CONFIG = {
  1: { label: 'eBook',     icon: FileText,   color: '#4d62cd' },
  2: { label: 'Audiobook', icon: Headphones, color: '#f59e0b' },
  0: { label: 'Bundle',    icon: Package,    color: '#10b981' },
};

const SUGGESTED_TAGS = ['Literature', 'History', 'Fiction', 'eBooks', 'Audiobooks', 'Culture'];

export default function SearchScreen() {
  const router = useRouter();
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm?.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.products.search({ searchTerm: searchTerm.trim(), pageSize: 40 });
      const items = data?.data || data?.content || data?.items || data?.$values || (Array.isArray(data) ? data : []);
      setResults(Array.isArray(items) ? items : []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => performSearch(query);

  const handleSelectTag = (tag) => {
    setQuery(tag);
    performSearch(tag);
  };

  const getImageUrl = (product) => {
    const url = product?.book?.coverImageUrl || product?.coverImageUrl || product?.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const renderResult = ({ item }) => {
    const imageUrl = getImageUrl(item);
    const title = item?.book?.title || item?.title || 'Untitled';
    const authors = item?.book?.authors?.map((a) => a.name).join(', ') || item?.author || '';
    const isFree = item?.isFree || item?.IsFree || Number(item?.price) === 0;
    const typeConf = TYPE_CONFIG[item?.productType] || TYPE_CONFIG[1];
    const TypeIcon = typeConf.icon;

    return (
      <TouchableOpacity
        style={[
          styles.resultCard, 
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}
        onPress={() => router.push(`/book/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.resultImage, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Book size={28} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.resultInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeConf.color + '22' }]}>
              <TypeIcon size={10} color={typeConf.color} strokeWidth={2.4} style={{ marginRight: 3 }} />
              <Text style={[styles.typeBadgeText, { color: typeConf.color }]}>{typeConf.label}</Text>
            </View>
            {isFree ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.success + '22' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.success }]}>FREE</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.goldGlow }]}>
                <Crown size={9} color={colors.gold} strokeWidth={2.5} style={{ marginRight: 2 }} />
                <Text style={[styles.statusBadgeText, { color: colors.gold }]}>PRO</Text>
              </View>
            )}
          </View>

          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.resultAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {authors || 'EriBooks Author'}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.resultPrice, { color: isFree ? colors.success : colors.primaryLight }]}>
              {isFree ? 'Free Access' : 'Subscription'}
            </Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('search.title', language) || 'Explore & Search'}</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Discover authors, books, audiobooks, and anthologies
        </Text>
      </View>

      {/* Modern Search Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
            shadowColor: isFocused ? colors.primary : '#000',
          },
        ]}
      >
        <SearchIcon size={20} color={isFocused ? colors.primary : colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('search.placeholder', language) || 'Search by title, author, or keyword...'}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity 
            onPress={() => { setQuery(''); setResults([]); setSearched(false); }}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggested Search Chips (when no search done yet) */}
      {!searched && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Sparkles size={14} color={colors.gold} style={{ marginRight: 6 }} />
            <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>Popular Categories</Text>
          </View>
          <View style={styles.tagWrap}>
            {SUGGESTED_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleSelectTag(tag)}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching library...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.centered}>
          <SearchIcon size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No books found</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('search.noResults', language)} "{query}"
          </Text>
        </View>
      ) : !searched ? (
        <View style={styles.emptyPrompt}>
          <BookOpen size={52} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
          <Text style={[styles.emptyPromptText, { color: colors.textSecondary }]}>
            {t('search.initial', language) || 'Search EriBooks to find your next great read'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 50,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
    borderRadius: 12,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.sm,
  },
  resultImage: {
    width: 88,
    height: 124,
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
  },
  resultInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 2,
  },
  resultAuthor: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyPromptText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
});
