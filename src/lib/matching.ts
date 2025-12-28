// Automatic matching service for lost and found items
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
