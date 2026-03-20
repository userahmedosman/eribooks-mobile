import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { 
  Newspaper, 
  ChevronRight, 
  Calendar, 
  Tag as TagIcon,
  AlertCircle
} from 'lucide-react-native';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';
import { api } from '../../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewsScreen() {
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });
  const colors = getColors(theme);
  
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.articles.getAll();
      // Handle array or nested data structures
      const articlesData = Array.isArray(data) ? data : data?.data || [];
      setArticles(articlesData);
    } catch (err) {
      console.error('Fetch articles error:', err);
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArticles();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'tg' ? 'en-GB' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderArticle = ({ item }) => (
    <TouchableOpacity 
      style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.CoverImageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop' }}
        style={styles.articleImage}
        resizeMode="cover"
      />
      
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
            <TagIcon size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.CategoryId || 'News'}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Calendar size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate(item.publishedAt || item.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={[styles.articleExcerpt, { color: colors.textSecondary }]} numberOfLines={3}>
          {item.content?.replace(/<[^>]*>?/gm, '')}
        </Text>

        <View style={styles.readMoreContainer}>
          <Text style={[styles.readMoreText, { color: colors.primary }]}>
            {t('news.readMore', language)}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <Newspaper size={48} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('news.title', language)}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {t('news.empty', language)}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={fetchArticles}
      >
        <Text style={[styles.retryText, { color: '#FFF' }]}>{t('common.retry', language)}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('news.title', language)}
        </Text>
        <TouchableOpacity 
          style={[styles.headerIcon, { backgroundColor: colors.surface }]}
          onPress={onRefresh}
        >
          <Newspaper size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {error && !refreshing && (
        <View style={[styles.errorBar, { backgroundColor: colors.error + '20' }]}>
          <AlertCircle size={16} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  articleCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.md,
  },
  articleImage: {
    width: '100%',
    height: 200,
  },
  articleContent: {
    padding: spacing.lg,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  articleExcerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  retryText: {
    fontWeight: '700',
  },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
});
