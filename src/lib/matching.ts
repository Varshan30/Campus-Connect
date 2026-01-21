// Automatic matching service for lost and found items
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FoundItem, ItemCategory } from './data';

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
}

// Calculate similarity between two strings (simple word matching)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  for (const word of words1) {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

// Calculate match score for a claim against item details
export function calculateMatchScore(
  item: FoundItem,
  securityAnswers: Record<string, string>,
  claimerDescription: string
): ClaimMatchScore {
  const breakdown: ClaimMatchScore['breakdown'] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Check color-related answers (all categories usually have color)
  const colorAnswerKeys = ['color', 'caseColor', 'clothingColor', 'bagColor', 'accessoryColor', 'itemColor', 'bookColor'];
  const colorAnswer = colorAnswerKeys.find(key => securityAnswers[key]);
  if (colorAnswer && securityAnswers[colorAnswer]) {
    maxScore += 25;
    const colorMatch = calculateSimilarity(
      item.description.toLowerCase(),
      securityAnswers[colorAnswer].toLowerCase()
    );
    const colorPoints = Math.round(colorMatch * 25);
    totalScore += colorPoints;
    breakdown.push({
      category: 'Color Match',
      points: colorPoints,
      maxPoints: 25,
      details: colorPoints > 15 ? 'Color description matches well' : colorPoints > 5 ? 'Partial color match' : 'Color did not match'
    });
  }

  // Check description match
  if (claimerDescription) {
    maxScore += 30;
    const descMatch = calculateSimilarity(item.description, claimerDescription);
    const descPoints = Math.round(descMatch * 30);
    totalScore += descPoints;
    breakdown.push({
      category: 'Description Match',
      points: descPoints,
      maxPoints: 30,
      details: descPoints > 20 ? 'Detailed description matches' : descPoints > 10 ? 'Some details match' : 'Description differs'
    });
  }

  // Check brand (if applicable)
  const brandAnswerKeys = ['clothingBrand', 'bagBrand', 'accessoryBrand'];
  const brandAnswer = brandAnswerKeys.find(key => securityAnswers[key]);
  if (brandAnswer && securityAnswers[brandAnswer]) {
    maxScore += 20;
    const brandLower = securityAnswers[brandAnswer].toLowerCase();
    const descLower = item.description.toLowerCase();
    const brandInDesc = descLower.includes(brandLower) || brandLower.split(/\s+/).some(b => descLower.includes(b));
    const brandPoints = brandInDesc ? 20 : 0;
    totalScore += brandPoints;
    breakdown.push({
      category: 'Brand Verification',
      points: brandPoints,
      maxPoints: 20,
      details: brandInDesc ? 'Brand matches' : 'Brand not verified'
    });
  }

  // Check unique features/damage
  const featureAnswerKeys = ['damage', 'uniqueFeature', 'accessoryFeature', 'itemFeature', 'bookMarks'];
  const featureAnswer = featureAnswerKeys.find(key => securityAnswers[key]);
  if (featureAnswer && securityAnswers[featureAnswer]) {
    maxScore += 25;
    const featureMatch = calculateSimilarity(
      item.description.toLowerCase(),
      securityAnswers[featureAnswer].toLowerCase()
    );
    const featurePoints = Math.round(featureMatch * 25);
    totalScore += featurePoints;
    breakdown.push({
      category: 'Unique Features',
      points: featurePoints,
      maxPoints: 25,
      details: featurePoints > 15 ? 'Unique features verified' : featurePoints > 5 ? 'Some features match' : 'Features unclear'
    });
  }

  // Number of security questions answered (engagement score)
  const answeredCount = Object.values(securityAnswers).filter(a => a.trim() !== '').length;
  maxScore += 20;
  const engagementPoints = Math.min(answeredCount * 5, 20);
  totalScore += engagementPoints;
  breakdown.push({
    category: 'Verification Effort',
    points: engagementPoints,
    maxPoints: 20,
    details: `${answeredCount} security questions answered`
  });

  // Ensure maxScore is at least 100 for percentage calculation
  if (maxScore < 100) maxScore = 100;

  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (percentage >= 70) {
    riskLevel = 'low';
  } else if (percentage >= 40) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    score: totalScore,
    maxScore,
    percentage,
    breakdown,
    riskLevel
  };
}

// Find potential matches for a new item
export async function findMatches(newItem: ItemData): Promise<MatchResult[]> {
  try {
    // If lost item, search found items. If found item, search lost items.
    const searchType = newItem.type === 'lost' ? 'found' : 'lost';
    
    // Query items of opposite type in the same category
    const q = query(
      collection(db, 'foundItems'),
      where('type', '==', searchType),
      where('category', '==', newItem.category),
      where('status', '==', 'available')
    );
    
    const snapshot = await getDocs(q);
    const matches: MatchResult[] = [];
    
    snapshot.docs.forEach(doc => {
      const item = doc.data();
      const matchReasons: string[] = [];
      let score = 0;
      
      // Same category (already filtered, but add to score)
      score += 30;
      matchReasons.push('Same category');
      
      // Same location
      if (item.location === newItem.location) {
        score += 25;
        matchReasons.push('Same location');
      }
      
      // Similar name
      const nameSimilarity = calculateSimilarity(item.name, newItem.name);
      if (nameSimilarity > 0.3) {
        score += Math.round(nameSimilarity * 25);
        matchReasons.push('Similar name');
      }
      
      // Similar description
      const descSimilarity = calculateSimilarity(item.description || '', newItem.description || '');
      if (descSimilarity > 0.2) {
        score += Math.round(descSimilarity * 20);
        matchReasons.push('Similar description');
      }
      
      // Only include if score is high enough
      if (score >= 50) {
        matches.push({
          itemId: doc.id,
          itemName: item.name,
          matchScore: score,
          matchReasons,
        });
      }
    });
    
    // Sort by score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  } catch (error) {
    console.error('Error finding matches:', error);
    return [];
  }
}

// Create notifications for matches
export async function notifyMatches(
  newItem: ItemData & { id: string },
  matches: MatchResult[],
  reporterUserId: string | null
): Promise<void> {
  if (matches.length === 0) return;
  
  try {
    const matchType = newItem.type === 'lost' ? 'found' : 'lost';
    const matchCount = matches.length;
    const topMatch = matches[0];
    
    // Notify the person who just reported
    if (reporterUserId) {
      await addDoc(collection(db, 'notifications'), {
        type: 'match',
        message: `🎯 We found ${matchCount} potential match${matchCount > 1 ? 'es' : ''} for your ${newItem.type} "${newItem.name}"! Top match: "${topMatch.itemName}" (${topMatch.matchScore}% match)`,
        itemId: newItem.id,
        userId: reporterUserId,
        read: false,
        createdAt: new Date().toISOString(),
        matches: matches.map(m => ({ id: m.itemId, name: m.itemName, score: m.matchScore })),
      });
    }
    
    // Also notify owners of matched items
    for (const match of matches) {
      // Get the matched item to find its owner
      const matchedItemQuery = query(
        collection(db, 'foundItems'),
        where('__name__', '==', match.itemId)
      );
      
      // We already have the item data, so we'll create notification for item owners
      // This is simplified - in production you'd fetch the owner from the matched item
    }
    
    console.log(`Created match notifications for ${matchCount} matches`);
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
    console.log(`Found ${matches.length} matches for "${newItem.name}"`);
  }
  
  return matches;
}
