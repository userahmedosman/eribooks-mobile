import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  StarHalf, 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  BookOpen, 
  User, 
  Calendar, 
  Hash,
  FileText,
  Clock,
  Mic
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { addToCart } from '../../src/lib/features/cart/cartSlice';
import { api } from '../../src/lib/api';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('description');
  const [showWebPlayer, setShowWebPlayer] = useState(false);

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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <AlertCircle size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Book not found'}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={[styles.retryText, { color: '#FFF' }]}>{t('common.back', language) || 'Go Back'}</Text>
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
  
  const productType = product.productType; // 0: Bundle, 1: eBook, 2: Audiobook
  const isEbook = productType === 0 || productType === 1;
  const isAudiobook = productType === 0 || productType === 2;
  const pageCount = product.pageCount || book?.pageCount;
  const audioDuration = product.audioDuration || book?.audioDuration;
  const audioReader = product.audioReader || book?.audioReader;

  const sampleAudioUrl = (() => {
    const url = product.SampleAudioUrl || product.sampleAudioUrl || book?.SampleAudioUrl || book?.sampleAudioUrl || product.sampleUrl || book?.sampleUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  })();

  const samplePdfUrl = (() => {
    const url = product.SamplePdfUrl || product.samplePdfUrl || book?.SamplePdfUrl || book?.samplePdfUrl || product.sampleUrl || book?.sampleUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  })();

  const imageUrl = (() => {
    const url = book.coverImageUrl || product.coverImageUrl || product.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  })();

  const handlePlaySample = () => {
    if (!sampleAudioUrl) return;
    setShowWebPlayer(!showWebPlayer);
  };

  const handleReadSample = async () => {
    if (!samplePdfUrl) return;
    try {
      await WebBrowser.openBrowserAsync(samplePdfUrl);
    } catch (err) {
      console.error('Error opening sample PDF:', err);
    }
  };

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

  const RatingStars = ({ rating }) => {
    const stars = [];
    const floorRating = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floorRating) {
        stars.push(<Star key={i} size={16} color={colors.warning} fill={colors.warning} />);
      } else if (i === floorRating + 1 && rating % 1 >= 0.5) {
        stars.push(<StarHalf key={i} size={16} color={colors.warning} fill={colors.warning} />);
      } else {
        stars.push(<Star key={i} size={16} color={colors.border} />);
      }
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with Back Button */}
        <View style={styles.topHeader}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <View style={[styles.imageSection, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderImage}>
              <BookOpen size={72} color={colors.textMuted} />
            </View>
          )}
        </View>

        {/* Book Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {authors ? (
            <View style={styles.authorRow}>
              <Text style={[styles.authorLabel, { color: colors.textSecondary }]}>{t('product.by', language) || 'by'}</Text>
              <Text style={[styles.authors, { color: colors.primary }]}>{authors}</Text>
            </View>
          ) : null}

          {/* Rating */}
          <View style={styles.ratingRow}>
            <RatingStars rating={rating || 0} />
            <Text style={[styles.ratingText, { color: colors.text }]}>{Number(rating || 0).toFixed(1)}</Text>
            {reviews.length > 0 && (
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                ({reviews.length} {t('product.reviews', language) || 'reviews'})
              </Text>
            )}
          </View>

          <Text style={[styles.price, { color: colors.text }]}>{price}</Text>

          {/* Format Specific Details */}
          <View style={styles.formatDetailsContainer}>
            {isEbook && (
              <View style={[styles.formatDetailBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <FileText size={16} color={colors.textSecondary} />
                <View style={styles.formatDetailTextContainer}>
                  <Text style={[styles.formatDetailLabel, { color: colors.textSecondary }]}>Pages</Text>
                  <Text style={[styles.formatDetailValue, { color: colors.text }]}>{pageCount || '--'}</Text>
                </View>
              </View>
            )}
            {isAudiobook && (
              <>
                <View style={[styles.formatDetailBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                  <Clock size={16} color={colors.textSecondary} />
                  <View style={styles.formatDetailTextContainer}>
                    <Text style={[styles.formatDetailLabel, { color: colors.textSecondary }]}>Duration</Text>
                    <Text style={[styles.formatDetailValue, { color: colors.text }]}>{audioDuration || '--'}</Text>
                  </View>
                </View>
                <View style={[styles.formatDetailBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                  <Mic size={16} color={colors.textSecondary} />
                  <View style={styles.formatDetailTextContainer}>
                    <Text style={[styles.formatDetailLabel, { color: colors.textSecondary }]}>Narrator</Text>
                    <Text style={[styles.formatDetailValue, { color: colors.text }]} numberOfLines={1}>{audioReader || '--'}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Sample Actions */}
          <View style={styles.sampleActionsContainer}>
            {isEbook && samplePdfUrl && (
              <TouchableOpacity style={[styles.sampleButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} onPress={handleReadSample}>
                <BookOpen size={20} color={colors.primary} />
                <Text style={[styles.sampleButtonText, { color: colors.text }]}>Read Sample</Text>
              </TouchableOpacity>
            )}
            {isAudiobook && sampleAudioUrl && !showWebPlayer && (
              <TouchableOpacity style={[styles.sampleButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} onPress={handlePlaySample}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.sampleButtonText, { color: colors.text }]}>Play Sample</Text>
              </TouchableOpacity>
            )}
            {isAudiobook && sampleAudioUrl && showWebPlayer && (
              <View style={[styles.sampleButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border, padding: 0, paddingVertical: 0, overflow: 'hidden' }]}>
                <WebView
                  source={{
                    html: `
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                          <style>
                            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: transparent; }
                            audio { width: 100%; max-width: 400px; outline: none; border-radius: 8px; }
                          </style>
                        </head>
                        <body>
                          <audio controls controlsList="nodownload noplaybackrate" autoplay>
                            <source src="${sampleAudioUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                          </audio>
                        </body>
                      </html>
                    `
                  }}
                  style={{ height: 60, width: '100%', backgroundColor: 'transparent' }}
                  scrollEnabled={false}
                  bounces={false}
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback={true}
                />
              </View>
            )}
          </View>

          {/* Custom Tabs */}
          <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.tabButton, selectedTab === 'description' && { borderBottomColor: colors.primary }]}
              onPress={() => setSelectedTab('description')}
            >
              <Text style={[styles.tabText, selectedTab === 'description' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>
                {t('product.description', language) || 'Description'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, selectedTab === 'reviews' && { borderBottomColor: colors.primary }]}
              onPress={() => setSelectedTab('reviews')}
            >
              <Text style={[styles.tabText, selectedTab === 'reviews' ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>
                {t('product.reviews', language) || 'Reviews'} ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          {selectedTab === 'description' ? (
            <View style={styles.descriptionSection}>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
            </View>
          ) : (
            <View style={styles.reviewsSection}>
              {reviews.length > 0 ? reviews.map((review, index) => (
                <View key={index} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary + '20' }]}>
                        <User size={14} color={colors.primary} />
                      </View>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>{review.reviewerName || 'Anonymous'}</Text>
                    </View>
                    <RatingStars rating={review.rating || review.star || 0} />
                  </View>
                  <Text style={[styles.reviewText, { color: colors.textSecondary }]}>
                    {review.content || review.comment}
                  </Text>
                </View>
              )) : (
                <Text style={[styles.description, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }]}>
                  No reviews yet.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.addToCartButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={handleAddToCart}
        >
          <ShoppingBag size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buyNowButton, { backgroundColor: colors.primary }]} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>{t('product.buyNow', language) || 'Buy Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  retryText: {
    ...typography.button,
  },
  imageSection: {
    height: 320,
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
    marginBottom: spacing.xs,
  },
  authors: {
    ...typography.body,
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
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  reviewCount: {
    ...typography.bodySmall,
  },
  price: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    lineHeight: 26,
  },
  reviewsSection: {
    marginBottom: spacing.lg,
  },
  reviewCard: {
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
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewText: {
    ...typography.bodySmall,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  addToCartButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addToCartText: {
    ...typography.button,
  },
  buyNowButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buyNowText: {
    ...typography.button,
  },
  formatDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  formatDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  formatDetailTextContainer: {
    flex: 1,
  },
  formatDetailLabel: {
    ...typography.caption,
  },
  formatDetailValue: {
    ...typography.label,
    fontSize: 12,
  },
  sampleActionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sampleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  sampleButtonText: {
    ...typography.button,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...typography.body,
  },
});
