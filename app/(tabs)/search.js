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
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Search as SearchIcon, X, Book, BookOpen } from 'lucide-react-native';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { api } from '../../src/lib/api';
import { t } from '../../src/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export default function SearchScreen() {
  const router = useRouter();
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.products.search({ searchTerm: query.trim(), pageSize: 30 });
      const items = data?.data || data?.content || data?.items || data?.$values || data || [];
      setResults(Array.isArray(items) ? items : []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const getImageUrl = (product) => {
    const url = product?.book?.coverImageUrl || product?.coverImageUrl || product?.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const renderResult = ({ item }) => {
    const imageUrl = getImageUrl(item);
    const title = item?.book?.title || item?.title || 'Untitled';
    const authors = item?.book?.authors?.map((a) => a.name).join(', ') || '';
    const price = item?.price != null ? `$${item.price.toFixed(2)}` : 'Free';

    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/book/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.resultImage, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Book size={32} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.resultAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{authors || 'EriBooks Author'}</Text>
          <Text style={[styles.resultPrice, { color: colors.primary }]}>{price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>{t('search.title', language)}</Text>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SearchIcon size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('search.placeholder', language)}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.centered}>
          <SearchIcon size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('search.noResults', language)} "{query}"
          </Text>
        </View>
      ) : !searched ? (
        <View style={styles.centered}>
          <BookOpen size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('search.initial', language)}
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
  screenTitle: {
    ...typography.h2,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
  },
  clearButton: {
    fontSize: 16,
    padding: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.sm,
  },
  resultImage: {
    width: 80,
    height: 120,
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
    justifyContent: 'center',
  },
  resultTitle: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  resultAuthor: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  resultPrice: {
    ...typography.body,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
