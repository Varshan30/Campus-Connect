// AI-Enhanced Automatic matching service for lost and found items
// Uses Grok Cloud AI for semantic matching with fallback to local heuristics
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FoundItem, ItemCategory } from './data';
import {
  isGrokConfigured,
  aiBatchMatch,
  aiVerifyClaim,
  type AIClaimVerification,
} from './grokAI';

interface ItemData {
  name: string;
  category: string;
  location: string;
  description: string;
  type: 'lost' | 'found';
  createdBy?: string;
  createdByEmail?: string;
}

interface MatchResult {
  itemId: string;
  itemName: string;
  matchScore: number;
  matchReasons: string[];
  aiPowered: boolean;
  aiReasoning?: string;
  matchedAttributes?: string[];
}

interface ClaimMatchScore {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    category: string;
    points: number;
    maxPoints: number;
    details: string;
  }[];
  riskLevel: 'low' | 'medium' | 'high';
  aiPowered: boolean;
  aiInsights?: {
    reasoning: string;
    overallAssessment: string;
    redFlags: string[];
    positiveIndicators: string[];
    confidence: string;
  };
}

// =============================================
//  LOCAL HEURISTIC MATCHING (Fallback)
// =============================================

// Calculate similarity between two strings (word overlap + bigram fuzzy)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2);

  const words1 = normalize(str1);
  const words2 = normalize(str2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  for (const word of words1) {
    if (words2.some((w) => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }

  // Bigram overlap for better fuzzy matching
  const bigrams1 = getBigrams(str1.toLowerCase());
  const bigrams2 = getBigrams(str2.toLowerCase());
  const bigramOverlap = calculateBigramSimilarity(bigrams1, bigrams2);

  const wordScore = matches / Math.max(words1.length, words2.length);
  return wordScore * 0.6 + bigramOverlap * 0.4;
}

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  const cleaned = str.replace(/\s+/g, '');
  for (let i = 0; i < cleaned.length - 1; i++) {
    bigrams.add(cleaned.substring(i, i + 2));
  }
  return bigrams;
}

function calculateBigramSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;
  let intersection = 0;
  set1.forEach((bigram) => {
    if (set2.has(bigram)) intersection++;
  });
  return (2 * intersection) / (set1.size + set2.size);
}

// Local claim score calculation (original logic with bigram enhancement)
function calculateLocalMatchScore(
  item: FoundItem,
  securityAnswers: Record<string, string>,
  claimerDescription: string
): ClaimMatchScore {
  const breakdown: ClaimMatchScore['breakdown'] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Color match
  const colorAnswerKeys = ['color', 'caseColor', 'clothingColor', 'bagColor', 'accessoryColor', 'itemColor', 'bookColor'];
  const colorAnswer = colorAnswerKeys.find((key) => securityAnswers[key]);
  if (colorAnswer && securityAnswers[colorAnswer]) {
    maxScore += 25;
    const colorMatch = calculateSimilarity(item.description.toLowerCase(), securityAnswers[colorAnswer].toLowerCase());
    const colorPoints = Math.round(colorMatch * 25);
    totalScore += colorPoints;
    breakdown.push({
      category: 'Color Match',
      points: colorPoints,
      maxPoints: 25,
      details: colorPoints > 15 ? 'Color description matches well' : colorPoints > 5 ? 'Partial color match' : 'Color did not match',
    });
  }

  // Description match
  if (claimerDescription) {
    maxScore += 30;
    const descMatch = calculateSimilarity(item.description, claimerDescription);
    const descPoints = Math.round(descMatch * 30);
    totalScore += descPoints;
    breakdown.push({
      category: 'Description Match',
      points: descPoints,
      maxPoints: 30,
      details: descPoints > 20 ? 'Detailed description matches' : descPoints > 10 ? 'Some details match' : 'Description differs',
    });
  }

  // Brand check
  const brandAnswerKeys = ['clothingBrand', 'bagBrand', 'accessoryBrand'];
  const brandAnswer = brandAnswerKeys.find((key) => securityAnswers[key]);
  if (brandAnswer && securityAnswers[brandAnswer]) {
    maxScore += 20;
    const brandLower = securityAnswers[brandAnswer].toLowerCase();
    const descLower = item.description.toLowerCase();
    const brandInDesc = descLower.includes(brandLower) || brandLower.split(/\s+/).some((b) => descLower.includes(b));
    const brandPoints = brandInDesc ? 20 : 0;
    totalScore += brandPoints;
    breakdown.push({
      category: 'Brand Verification',
      points: brandPoints,
      maxPoints: 20,
      details: brandInDesc ? 'Brand matches' : 'Brand not verified',
    });
  }

  // Unique features
  const featureAnswerKeys = ['damage', 'uniqueFeature', 'accessoryFeature', 'itemFeature', 'bookMarks'];
  const featureAnswer = featureAnswerKeys.find((key) => securityAnswers[key]);
  if (featureAnswer && securityAnswers[featureAnswer]) {
    maxScore += 25;
    const featureMatch = calculateSimilarity(item.description.toLowerCase(), securityAnswers[featureAnswer].toLowerCase());
    const featurePoints = Math.round(featureMatch * 25);
    totalScore += featurePoints;
    breakdown.push({
      category: 'Unique Features',
      points: featurePoints,
      maxPoints: 25,
      details: featurePoints > 15 ? 'Unique features verified' : featurePoints > 5 ? 'Some features match' : 'Features unclear',
    });
  }

  // Engagement score
  const answeredCount = Object.values(securityAnswers).filter((a) => a.trim() !== '').length;
  maxScore += 20;
  const engagementPoints = Math.min(answeredCount * 5, 20);
  totalScore += engagementPoints;
  breakdown.push({
    category: 'Verification Effort',
    points: engagementPoints,
    maxPoints: 20,
    details: `${answeredCount} security questions answered`,
  });

  if (maxScore < 100) maxScore = 100;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let riskLevel: 'low' | 'medium' | 'high';
  if (percentage >= 70) riskLevel = 'low';
  else if (percentage >= 40) riskLevel = 'medium';
  else riskLevel = 'high';

  return { score: totalScore, maxScore, percentage, breakdown, riskLevel, aiPowered: false };
}

// =============================================
//  AI-POWERED MATCHING (Grok Cloud)
// =============================================

// Security questions mapping for AI context
const categorySecurityQuestions: Record<string, { id: string; question: string }[]> = {
  electronics: [
    { id: 'color', question: 'What is the color of the device?' },
    { id: 'caseColor', question: 'What is the color/type of the case (if any)?' },
    { id: 'damage', question: 'Are there any visible damages or scratches?' },
    { id: 'uniqueFeature', question: 'Any unique identifying marks or stickers?' },
  ],
  books: [
    { id: 'bookColor', question: 'What is the cover color of the book?' },
    { id: 'bookMarks', question: 'Any bookmarks or notes inside?' },
    { id: 'ownerName', question: 'Is your name written anywhere in the book?' },
  ],
  clothing: [
    { id: 'clothingColor', question: 'What is the primary color?' },
    { id: 'clothingBrand', question: 'What is the brand?' },
    { id: 'clothingSize', question: 'What size is it?' },
  ],
  keys: [
    { id: 'keyCount', question: 'How many keys are on the keychain?' },
    { id: 'keychainDesc', question: 'Describe any keychains or attachments' },
    { id: 'keyType', question: 'What types of keys are included?' },
  ],
  'id-cards': [
    { id: 'cardType', question: 'What type of ID card is it?' },
    { id: 'cardholderName', question: 'What name is on the card?' },
    { id: 'cardExpiry', question: 'What is the expiration date or ID number prefix?' },
  ],
  accessories: [
    { id: 'accessoryColor', question: 'What is the primary color?' },
    { id: 'accessoryBrand', question: 'What is the brand (if known)?' },
    { id: 'accessoryFeature', question: 'Any unique features or damage?' },
  ],
  bags: [
    { id: 'bagColor', question: 'What is the bag color?' },
    { id: 'bagBrand', question: 'What is the brand?' },
    { id: 'bagContents', question: 'What items were inside the bag?' },
  ],
  other: [
    { id: 'itemColor', question: 'What is the primary color?' },
    { id: 'itemFeature', question: 'Any unique identifying features?' },
  ],
};

// Local heuristic findMatches (fallback)
async function findLocalMatches(newItem: ItemData): Promise<MatchResult[]> {
  const searchType = newItem.type === 'lost' ? 'found' : 'lost';
  const q = query(
    collection(db, 'foundItems'),
    where('type', '==', searchType),
    where('category', '==', newItem.category),
    where('status', '==', 'available')
  );

  const snapshot = await getDocs(q);
  const matches: MatchResult[] = [];

  snapshot.docs.forEach((docSnap) => {
    const item = docSnap.data();
    const matchReasons: string[] = [];
    let score = 0;

    score += 30;
    matchReasons.push('Same category');

    if (item.location === newItem.location) {
      score += 25;
      matchReasons.push('Same location');
    }

    const nameSimilarity = calculateSimilarity(item.name, newItem.name);
    if (nameSimilarity > 0.3) {
      score += Math.round(nameSimilarity * 25);
      matchReasons.push('Similar name');
    }

    const descSimilarity = calculateSimilarity(item.description || '', newItem.description || '');
    if (descSimilarity > 0.2) {
      score += Math.round(descSimilarity * 20);
      matchReasons.push('Similar description');
    }

    if (score >= 50) {
      matches.push({
        itemId: docSnap.id,
        itemName: item.name,
        matchScore: score,
        matchReasons,
        aiPowered: false,
      });
    }
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

// AI-powered findMatches using Grok — broader search, semantic understanding
async function findAIMatches(newItem: ItemData): Promise<MatchResult[]> {
  const searchType = newItem.type === 'lost' ? 'found' : 'lost';

  // Broader query: AI can find cross-category semantic matches
  const q = query(
    collection(db, 'foundItems'),
    where('type', '==', searchType),
    where('status', '==', 'available')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return [];

  const candidates = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    name: docSnap.data().name || '',
    category: docSnap.data().category || '',
    location: docSnap.data().location || '',
    description: docSnap.data().description || '',
  }));

  const aiResults = await aiBatchMatch(
    {
      name: newItem.name,
      category: newItem.category,
      location: newItem.location,
      description: newItem.description,
      type: newItem.type,
    },
    candidates
  );

  return aiResults
    .filter((r) => r.score >= 30)
    .map((r) => ({
      itemId: r.id,
      itemName: candidates.find((c) => c.id === r.id)?.name || 'Unknown',
      matchScore: r.score,
      matchReasons: r.matchedAttributes || [],
      aiPowered: true,
      aiReasoning: r.reasoning,
      matchedAttributes: r.matchedAttributes,
    }))
    .slice(0, 5);
}

// =============================================
//  PUBLIC API (auto-selects AI vs local)
// =============================================

/**
 * Calculate match score for a claim against item details.
 * Uses Grok AI if configured, otherwise falls back to local heuristics.
 */
export async function calculateMatchScore(
  item: FoundItem,
  securityAnswers: Record<string, string>,
  claimerDescription: string
): Promise<ClaimMatchScore> {
  // Always compute local score first (fast, reliable)
  const localScore = calculateLocalMatchScore(item, securityAnswers, claimerDescription);

  // Try AI verification if Grok is configured
  if (isGrokConfigured()) {
    try {
      const questions = categorySecurityQuestions[item.category] || categorySecurityQuestions.other;

      const aiResult: AIClaimVerification = await aiVerifyClaim(
        {
          name: item.name,
          category: item.category,
          description: item.description,
          location: item.location,
          dateFound: item.dateFound,
        },
        {
          description: claimerDescription,
          securityAnswers,
          securityQuestions: questions,
        }
      );

      // Blend AI and local scores (AI 60%, local 40%)
      const blendedPercentage = Math.round(aiResult.verificationScore * 0.6 + localScore.percentage * 0.4);

      const aiBreakdown = aiResult.breakdown.map((b) => ({
        category: `🤖 ${b.category}`,
        points: b.score,
        maxPoints: b.maxScore,
        details: b.aiInsight,
      }));

      let riskLevel: 'low' | 'medium' | 'high';
      if (blendedPercentage >= 70) riskLevel = 'low';
      else if (blendedPercentage >= 40) riskLevel = 'medium';
      else riskLevel = 'high';

      // Use AI risk level if it's more conservative
      if (aiResult.riskLevel === 'high' && riskLevel !== 'high') {
        riskLevel = 'medium';
      }

      return {
        score: Math.round((blendedPercentage / 100) * localScore.maxScore),
        maxScore: localScore.maxScore,
        percentage: blendedPercentage,
        breakdown: [...localScore.breakdown, ...aiBreakdown],
        riskLevel,
        aiPowered: true,
        aiInsights: {
          reasoning: aiResult.reasoning,
          overallAssessment: aiResult.overallAssessment,
          redFlags: aiResult.redFlags,
          positiveIndicators: aiResult.positiveIndicators,
          confidence: aiResult.confidence,
        },
      };
    } catch (error) {
      console.warn('AI claim verification failed, using local scoring:', error);
      return localScore;
    }
  }

  return localScore;
}

/**
 * Find potential matches for a new item.
 * Uses Grok AI if configured (broader semantic matching),
 * otherwise falls back to local heuristics.
 */
export async function findMatches(newItem: ItemData): Promise<MatchResult[]> {
  if (isGrokConfigured()) {
    try {
      const aiMatches = await findAIMatches(newItem);
      if (aiMatches.length > 0) {
        console.log(`🤖 AI found ${aiMatches.length} matches for "${newItem.name}"`);
        return aiMatches;
      }
      console.log('🤖 AI found no matches, trying local heuristics...');
    } catch (error) {
      console.warn('AI matching failed, falling back to local:', error);
    }
  }

  return findLocalMatches(newItem);
}

// Create notifications for matches
export async function notifyMatches(
  newItem: ItemData & { id: string },
  matches: MatchResult[],
  reporterUserId: string | null
): Promise<void> {
  if (matches.length === 0) return;

  try {
    const matchCount = matches.length;
    const topMatch = matches[0];
    const aiLabel = topMatch.aiPowered ? ' (AI-verified)' : '';

    if (reporterUserId) {
      await addDoc(collection(db, 'notifications'), {
        type: 'match',
        message: `🎯 We found ${matchCount} potential match${matchCount > 1 ? 'es' : ''} for your ${newItem.type} "${newItem.name}"! Top match: "${topMatch.itemName}" (${topMatch.matchScore}% match${aiLabel})`,
        itemId: newItem.id,
        createdBy: reporterUserId,
        readBy: [],
        read: false,
        createdAt: new Date().toISOString(),
        matches: matches.map((m) => ({
          id: m.itemId,
          name: m.itemName,
          score: m.matchScore,
          aiPowered: m.aiPowered,
          reasoning: m.aiReasoning,
        })),
      });
    }

    console.log(`Created match notifications for ${matchCount} matches${topMatch.aiPowered ? ' (AI-powered)' : ''}`);
  } catch (error) {
    console.error('Error creating match notifications:', error);
  }
}

// Main function to run matching when item is reported
export async function runAutoMatching(
  newItem: ItemData & { id: string },
  reporterUserId: string | null
): Promise<MatchResult[]> {
  const matches = await findMatches(newItem);

  if (matches.length > 0) {
    await notifyMatches(newItem, matches, reporterUserId);
    const mode = matches[0]?.aiPowered ? '🤖 AI' : '📋 Local';
    console.log(`${mode} found ${matches.length} matches for "${newItem.name}"`);
  }

  return matches;
}
