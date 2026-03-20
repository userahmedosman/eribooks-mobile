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
  BookOpen, 
  User, 
  FileText,
  Clock,
  Mic,
  ShieldCheck,
  Crown,
  Lock,
  Headphones,
  Play,
  PlayCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { addToCart } from '../../src/lib/features/cart/cartSlice';
import { api } from '../../src/lib/api';
import { getColors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { t } from '../../src/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.ui || { theme: 'dark', language: 'en' });

  const colors = getColors(theme);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('description');

  // Access control
  const [accessStatus, setAccessStatus] = useState({ hasAccess: false, hasPurchased: false });
  const [fullContent, setFullContent] = useState(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);

  // PDF reader state
  const [showPdfReader, setShowPdfReader] = useState(false);

  // Audio chapter player state
  const [playingChapterId, setPlayingChapterId] = useState(null);
  const [playingChapterUrl, setPlayingChapterUrl] = useState(null);
  const [audioChapters, setAudioChapters] = useState([]);

  // ─── Fetch product data ───
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

  // ─── Set audio chapters from product/fullContent ───
  useEffect(() => {
    if (!product) return;
    if (accessStatus.hasAccess && fullContent?.audioChapters) {
      // Full chapters with real audio URLs
      setAudioChapters(fullContent.audioChapters);
    } else if (product.audioChapters) {
      // Sample: chapters without audio urls (show locked)
      setAudioChapters(product.audioChapters.map(c => ({ ...c, audioUrl: null })));
    }
  }, [accessStatus.hasAccess, fullContent, product]);

  // ─── Check subscription access once product is loaded ───
  useEffect(() => {
    const checkProductAccess = async () => {
      if (!product) return;

      const isFree = product.isFree || product.IsFree || Number(product.price) === 0;
      if (isFree) {
        setAccessStatus({ hasAccess: true, hasPurchased: true });
        return;
      }

      if (isAuthenticated && id) {
        setIsLoadingAccess(true);
        try {
          const accessData = await api.products.checkAccess(id);
          if (accessData) {
            setAccessStatus(accessData);
            if (accessData.hasAccess) {
              try {
                const contentData = await api.products.getContent(id);
                if (contentData) setFullContent(contentData);
              } catch (e) {
                console.warn('[BookDetail] Could not fetch full content:', e.message);
              }
            }
          }
        } catch (err) {
          console.warn('[BookDetail] Access check failed:', err.message);
        } finally {
          setIsLoadingAccess(false);
        }
      }
    };

    checkProductAccess();
  }, [isAuthenticated, id, product]);

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
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Book not found'}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.retryText}>{t('common.back', language) || 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const book = product.book || {};
  const title = book.title || product.title || 'Untitled';
  const authors = book.authors?.map((a) => a.name).join(', ') || '';
  const description = book.description || product.description || 'No description available.';
  const isFree = product.isFree || product.IsFree || Number(product.price) === 0;
  const price = isFree ? (t('product.free', language) || 'Free') : `$${Number(product.price || 0).toFixed(2)}`;
  const rating = product.rating || product.averageRating;
  const reviews = book.reviews || [];

  const productType = product.productType; // 0: Bundle, 1: eBook, 2: Audiobook
  const isEbook = productType === 0 || productType === 1;
  const isAudiobook = productType === 0 || productType === 2;
  const pageCount = product.pageCount || book?.pageCount;
  const audioDuration = product.audioDuration || book?.audioDuration;
  const audioReader = product.audioReader || book?.audioReader;

  // Resolve PDF URL
  const pdfUrl = accessStatus.hasAccess
    ? resolveUrl(fullContent?.bookUrl || product.bookUrl || book?.bookUrl || book?.pdfUrl)
    : resolveUrl(product.SamplePdfUrl || product.samplePdfUrl || book?.SamplePdfUrl || book?.samplePdfUrl);

  const imageUrl = resolveUrl(book.coverImageUrl || product.coverImageUrl || product.imageUrl);

  // Access badge label
  const accessBadgeLabel = accessStatus.hasAccess
    ? (accessStatus.hasSubscription ? 'Subscription Active' : isFree ? 'Free' : 'Owned')
    : null;

  const showUpgradePrompt = isAuthenticated && !accessStatus.hasAccess && accessStatus.accessMessage;
  const showTierUpgrade = showUpgradePrompt && accessStatus.customerSubscriptionTier === 1 && accessStatus.productTier === 2;

  // ─── Chapter play handler ───
  const handlePlayChapter = (chapter) => {
    const url = resolveUrl(
      accessStatus.hasAccess
        ? (chapter.audioUrl || chapter.url)
        : (chapter.SampleAudioUrl || chapter.sampleAudioUrl || chapter.sampleUrl)
    );

    if (!url) return; // locked chapter

    if (playingChapterId === chapter.id) {
      // Toggle off
      setPlayingChapterId(null);
      setPlayingChapterUrl(null);
    } else {
      setPlayingChapterId(chapter.id);
      setPlayingChapterUrl(url);
    }
  };

  const handleReadBook = () => {
    if (Platform.OS === 'web' && pdfUrl) {
      WebBrowser.openBrowserAsync(pdfUrl);
    } else {
      setShowPdfReader(!showPdfReader);
    }
  };

  const handleAddToCart = () => dispatch(addToCart({ productId: String(product.id) }));
  const handleBuyNow = () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    dispatch(addToCart({ productId: String(product.id) }));
    router.push('/cart');
  };

  const RatingStars = ({ rating }) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) stars.push(<Star key={i} size={14} color={colors.warning} fill={colors.warning} />);
      else if (i === floor + 1 && rating % 1 >= 0.5) stars.push(<StarHalf key={i} size={14} color={colors.warning} fill={colors.warning} />);
      else stars.push(<Star key={i} size={14} color={colors.border} />);
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          {isLoadingAccess ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : accessBadgeLabel ? (
            <View style={[styles.accessBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
              <ShieldCheck size={12} color={colors.success} />
              <Text style={[styles.accessBadgeText, { color: colors.success }]}>{accessBadgeLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Cover Image ── */}
        <View style={[styles.imageSection, { backgroundColor: colors.surfaceLight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderImage}><BookOpen size={72} color={colors.textMuted} /></View>
          )}
          <View style={styles.imageBadges}>
            {isEbook && <View style={[styles.imageBadge, { backgroundColor: colors.surface + 'DD' }]}><FileText size={14} color={colors.text} /></View>}
            {isAudiobook && <View style={[styles.imageBadge, { backgroundColor: colors.surface + 'DD' }]}><Headphones size={14} color={colors.text} /></View>}
          </View>
        </View>

        <View style={styles.infoSection}>
          {/* ── Title & Author ── */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {authors ? (
            <View style={styles.authorRow}>
              <Text style={[styles.authorLabel, { color: colors.textSecondary }]}>{t('product.by', language) || 'by'} </Text>
              <Text style={[styles.authors, { color: colors.primary }]}>{authors}</Text>
            </View>
          ) : null}

          {/* ── Rating ── */}
          <View style={styles.ratingRow}>
            <RatingStars rating={rating || 0} />
            <Text style={[styles.ratingText, { color: colors.text }]}>{Number(rating || 0).toFixed(1)}</Text>
            {reviews.length > 0 && (
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({reviews.length} {t('product.reviews', language) || 'reviews'})</Text>
            )}
          </View>

          {/* ── Price (hide when owned) ── */}
          {!accessStatus.hasAccess && (
            <Text style={[styles.price, { color: isFree ? colors.success : colors.text }]}>{price}</Text>
          )}

          {/* ── Format Details ── */}
          <View style={styles.formatDetailsContainer}>
            {isEbook && pageCount && (
              <View style={[styles.formatDetailBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <FileText size={16} color={colors.textSecondary} />
                <View>
                  <Text style={[styles.formatDetailLabel, { color: colors.textSecondary }]}>Pages</Text>
                  <Text style={[styles.formatDetailValue, { color: colors.text }]}>{pageCount}</Text>
                </View>
              </View>
            )}
            {isAudiobook && audioDuration && (
              <View style={[styles.formatDetailBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Clock size={16} color={colors.textSecondary} />
                <View>
                  <Text style={[styles.formatDetailLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <Text style={[styles.formatDetailValue, { color: colors.text }]}>{audioDuration}</Text>
                </View>
              </View>
            )}
            {isAudiobook && audioReader && (
              <View style={[styles.formatDetailBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Mic size={16} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formatDetailLabel, { color: colors.textSecondary }]}>Narrator</Text>
                  <Text style={[styles.formatDetailValue, { color: colors.text }]} numberOfLines={1}>{audioReader}</Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Upgrade / Access Prompt ── */}
          {showUpgradePrompt && (
            <View style={[styles.upgradeCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <View style={[styles.upgradeIconBox, { backgroundColor: colors.primary + '20' }]}>
                <Lock size={20} color={colors.primary} />
              </View>
              <View style={styles.upgradeContent}>
                <Text style={[styles.upgradeTitle, { color: colors.text }]}>Subscription Required</Text>
                <Text style={[styles.upgradeMessage, { color: colors.textSecondary }]}>{accessStatus.accessMessage}</Text>
                {showTierUpgrade && (
                  <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/subscriptions')}>
                    <Crown size={14} color="#FFF" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* ── eBook Reader Section ────────────── */}
          {/* ═══════════════════════════════════════ */}
          {isEbook && pdfUrl && (
            <View style={styles.contentSection}>
              <TouchableOpacity
                style={[styles.contentSectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleReadBook}
              >
                <View style={styles.contentSectionLeft}>
                  <View style={[styles.contentSectionIcon, { backgroundColor: (accessStatus.hasAccess ? colors.primary : colors.surfaceLight) + '30' }]}>
                    <BookOpen size={20} color={accessStatus.hasAccess ? colors.primary : colors.textMuted} />
                  </View>
                  <Text style={[styles.contentSectionTitle, { color: colors.text }]}>
                    {accessStatus.hasAccess ? 'Read Book' : 'Read Sample'}
                  </Text>
                </View>
                {showPdfReader ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
              </TouchableOpacity>

              {showPdfReader && (
                <View style={[styles.pdfContainer, { borderColor: colors.border }]}>
                  <WebView
                    source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` }}
                    style={styles.pdfWebView}
                    startInLoadingState
                    renderLoading={() => (
                      <View style={[styles.centered, { backgroundColor: colors.background, height: 300 }]}>
                        <ActivityIndicator color={colors.primary} />
                        <Text style={[{ color: colors.textSecondary, marginTop: spacing.sm }, typography.bodySmall]}>Loading book...</Text>
                      </View>
                    )}
                  />
                </View>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* ── Audio Chapters Section ──────────── */}
          {/* ═══════════════════════════════════════ */}
          {isAudiobook && audioChapters.length > 0 && (
            <View style={styles.contentSection}>
              <View style={[styles.chaptersHeader, { borderColor: colors.border }]}>
                <View style={styles.contentSectionLeft}>
                  <View style={[styles.contentSectionIcon, { backgroundColor: (accessStatus.hasAccess ? colors.primary : colors.surfaceLight) + '30' }]}>
                    <Headphones size={20} color={accessStatus.hasAccess ? colors.primary : colors.textMuted} />
                  </View>
                  <Text style={[styles.contentSectionTitle, { color: colors.text }]}>
                    {accessStatus.hasAccess ? 'Audio Chapters' : 'Chapter Previews'}
                  </Text>
                </View>
                <View style={[styles.chapterCountBadge, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.chapterCountText, { color: colors.textMuted }]}>
                    {audioChapters.length} tracks
                  </Text>
                </View>
              </View>

              {/* Chapter list */}
              {audioChapters.map((chapter, index) => {
                const chapterId = chapter.id || chapter.chapterId;
                const isPlaying = playingChapterId === chapterId;
                const hasChapterUrl = accessStatus.hasAccess
                  ? !!resolveUrl(chapter.audioUrl || chapter.url)
                  : !!resolveUrl(chapter.SampleAudioUrl || chapter.sampleAudioUrl || chapter.sampleUrl);

                return (
                  <View key={chapterId || index}>
                    <TouchableOpacity
                      style={[
                        styles.chapterRow,
                        {
                          backgroundColor: isPlaying ? colors.primary + '15' : colors.surface,
                          borderColor: isPlaying ? colors.primary + '40' : colors.border,
                        }
                      ]}
                      onPress={() => handlePlayChapter(chapter)}
                      disabled={!hasChapterUrl}
                    >
                      {/* Track number / play indicator */}
                      <View style={[
                        styles.chapterNumber,
                        { backgroundColor: isPlaying ? colors.primary : colors.surfaceLight }
                      ]}>
                        {isPlaying ? (
                          <View style={styles.playingBars}>
                            <View style={[styles.bar, { backgroundColor: '#FFF', height: 8 }]} />
                            <View style={[styles.bar, { backgroundColor: '#FFF', height: 12 }]} />
                            <View style={[styles.bar, { backgroundColor: '#FFF', height: 6 }]} />
                          </View>
                        ) : hasChapterUrl ? (
                          <Play size={12} color={colors.textMuted} fill={colors.textMuted} />
                        ) : (
                          <Lock size={12} color={colors.textMuted} />
                        )}
                      </View>

                      {/* Chapter info */}
                      <View style={styles.chapterInfo}>
                        <Text style={[styles.chapterTitle, { color: isPlaying ? colors.primary : colors.text }]} numberOfLines={1}>
                          {chapter.title || chapter.chapterTitle || `Chapter ${chapter.chapterNumber || index + 1}`}
                        </Text>
                        {isPlaying && (
                          <Text style={[styles.chapterNowPlaying, { color: colors.primary }]}>Now Playing</Text>
                        )}
                        {!hasChapterUrl && !isPlaying && (
                          <Text style={[styles.chapterNowPlaying, { color: colors.textMuted }]}>Subscribe to unlock</Text>
                        )}
                      </View>

                      {/* Duration */}
                      {chapter.duration && (
                        <Text style={[styles.chapterDuration, { color: colors.textMuted }]}>{chapter.duration}</Text>
                      )}
                    </TouchableOpacity>

                    {/* Inline Audio Player for active chapter */}
                    {isPlaying && playingChapterUrl && (
                      <View style={[styles.inlinePlayer, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                        <WebView
                          source={{
                            html: `
                              <html>
                                <head>
                                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                                  <style>
                                    body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: transparent; }
                                    audio { width: 100%; outline: none; border-radius: 8px; }
                                  </style>
                                </head>
                                <body>
                                  <audio controls controlsList="nodownload noplaybackrate" autoplay>
                                    <source src="${playingChapterUrl}" type="audio/mpeg">
                                  </audio>
                                </body>
                              </html>
                            `
                          }}
                          style={{ height: 56, width: '100%' }}
                          scrollEnabled={false}
                          bounces={false}
                          mediaPlaybackRequiresUserAction={false}
                          allowsInlineMediaPlayback={true}
                          backgroundColor="transparent"
                        />
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Locked chapters hint for non-subscribers */}
              {!accessStatus.hasAccess && audioChapters.length > 0 && (
                <View style={[styles.lockedHint, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
                  <Text style={[styles.lockedHintText, { color: colors.warning }]}>
                    Subscribe to unlock all {audioChapters.length} chapters
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Tabs: Description / Reviews ── */}
          <View style={[styles.tabsContainer, { borderBottomColor: colors.border, marginTop: spacing.lg }]}>
            {['description', 'reviews'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, selectedTab === tab && { borderBottomColor: colors.primary }]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabText, selectedTab === tab ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>
                  {tab === 'description'
                    ? (t('product.description', language) || 'Description')
                    : `${t('product.reviews', language) || 'Reviews'} (${reviews.length})`
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedTab === 'description' ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
          ) : reviews.length > 0 ? (
            reviews.map((review, index) => (
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
                <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{review.content || review.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.description, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }]}>
              No reviews yet.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom Action Bar (hidden when owned) ── */}
      {!accessStatus.hasAccess && (
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.addToCartButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleAddToCart}>
            <ShoppingBag size={20} color={colors.text} />
          </TouchableOpacity>
          {isAuthenticated && (
            <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/subscriptions')}>
              <Crown size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>View Plans</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.buyNowButton, { backgroundColor: isAuthenticated ? colors.surface : colors.primary, borderColor: colors.border, borderWidth: isAuthenticated ? 1.5 : 0 }]}
            onPress={handleBuyNow}
          >
            <Text style={[styles.actionButtonText, { color: isAuthenticated ? colors.text : '#FFF' }]}>
              {t('product.buyNow', language) || 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  errorText: { ...typography.body, textAlign: 'center', marginVertical: spacing.md },
  retryButton: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  retryText: { ...typography.button, color: '#FFF' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  accessBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  accessBadgeText: { ...typography.caption, fontWeight: '700', fontSize: 11 },

  imageSection: { height: 300, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  imageBadges: { position: 'absolute', top: spacing.sm, right: spacing.sm, gap: 4 },
  imageBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  coverImage: { width: '55%', height: '90%', borderRadius: borderRadius.md },
  placeholderImage: { alignItems: 'center', justifyContent: 'center' },

  infoSection: { padding: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.xs },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  authorLabel: { ...typography.body },
  authors: { ...typography.body, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  starsRow: { flexDirection: 'row', marginRight: spacing.sm },
  ratingText: { ...typography.body, fontWeight: '700', marginRight: spacing.sm },
  reviewCount: { ...typography.bodySmall },
  price: { ...typography.h2, marginBottom: spacing.lg },

  formatDetailsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  formatDetailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, flex: 1, minWidth: '45%',
  },
  formatDetailLabel: { ...typography.caption },
  formatDetailValue: { ...typography.label, fontSize: 12 },

  // Upgrade prompt
  upgradeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, marginBottom: spacing.lg,
  },
  upgradeIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  upgradeContent: { flex: 1 },
  upgradeTitle: { ...typography.label, fontWeight: '700', marginBottom: 4 },
  upgradeMessage: { ...typography.bodySmall, lineHeight: 18, marginBottom: spacing.sm },
  upgradeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg, alignSelf: 'flex-start',
  },
  upgradeButtonText: { ...typography.caption, fontWeight: '700', color: '#FFF' },

  // Content sections (PDF reader + audio chapters)
  contentSection: { marginBottom: spacing.xl },
  contentSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm,
  },
  chaptersHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: spacing.sm, marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  contentSectionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contentSectionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  contentSectionTitle: { ...typography.label, fontWeight: '700' },
  chapterCountBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  chapterCountText: { ...typography.caption, fontSize: 11, fontWeight: '600' },

  // PDF
  pdfContainer: { borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1 },
  pdfWebView: { height: 480 },

  // Audio chapter rows
  chapterRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, marginBottom: spacing.xs,
    borderRadius: borderRadius.lg, borderWidth: 1,
  },
  chapterNumber: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  playingBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 },
  bar: { width: 3, borderRadius: 2 },
  chapterInfo: { flex: 1 },
  chapterTitle: { ...typography.body, fontWeight: '500' },
  chapterNowPlaying: { ...typography.caption, fontSize: 10, fontWeight: '700', marginTop: 2 },
  chapterDuration: { ...typography.caption, fontFamily: 'monospace', fontSize: 11 },

  // Inline audio player
  inlinePlayer: {
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderRadius: borderRadius.md, marginBottom: spacing.xs, overflow: 'hidden',
  },

  lockedHint: {
    padding: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1, marginTop: spacing.sm, alignItems: 'center',
  },
  lockedHintText: { ...typography.bodySmall, fontWeight: '600' },

  // Tabs
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: spacing.lg },
  tabButton: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { ...typography.body },
  description: { ...typography.body, lineHeight: 26, marginBottom: spacing.lg },
  reviewCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewerAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reviewerName: { ...typography.label },
  reviewText: { ...typography.bodySmall, lineHeight: 20 },

  // Bottom bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', borderTopWidth: 1,
    padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm,
  },
  addToCartButton: { width: 52, borderWidth: 1.5, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  subscribeButton: { flex: 1, flexDirection: 'row', borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  buyNowButton: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { ...typography.button, color: '#FFF' },
});
