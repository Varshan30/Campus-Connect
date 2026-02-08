// Claim Verification Service — Backend fraud detection & legitimacy checks
// Runs multi-layer verification when a user claims an item

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FoundItem } from './data';
import { isGrokConfigured, aiVerifyClaim, type AIClaimVerification } from './grokAI';

// =============================================
//  TYPES
// =============================================

export interface VerificationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ClaimVerificationResult {
  decision: 'auto_approved' | 'pending_review' | 'auto_rejected';
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  checks: VerificationCheck[];
  aiVerification: AIClaimVerification | null;
  summary: string;
  timestamp: string;
  processingTimeMs: number;
}

interface ClaimInput {
  itemId: string;
  item: FoundItem;
  claimerName: string;
  claimerEmail: string;
  claimerPhone: string;
  claimerDescription: string;
  securityAnswers: Record<string, string>;
  proofImages: string[];
  userId: string | null;
}

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

// =============================================
//  INDIVIDUAL VERIFICATION CHECKS
// =============================================

/**
 * Check 1: Duplicate claim — has this user already claimed this item?
 */
async function checkDuplicateClaim(input: ClaimInput): Promise<VerificationCheck> {
  try {
    const q = query(
      collection(db, 'claims'),
      where('itemId', '==', input.itemId),
      where('claimerEmail', '==', input.claimerEmail)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return {
        name: 'Duplicate Claim Detection',
        status: 'fail',
        message: `This email has already submitted a claim for this item (${snapshot.size} existing claim${snapshot.size > 1 ? 's' : ''}).`,
        severity: 'critical',
      };
    }
    return {
      name: 'Duplicate Claim Detection',
      status: 'pass',
      message: 'No previous claims from this email for this item.',
      severity: 'critical',
    };
  } catch {
    return {
      name: 'Duplicate Claim Detection',
      status: 'warn',
      message: 'Could not verify duplicate claims.',
      severity: 'critical',
    };
  }
}

/**
 * Check 2: Claim flooding — has this user submitted too many claims recently?
 */
async function checkClaimFlood(input: ClaimInput): Promise<VerificationCheck> {
  try {
    // All claims from this email in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const q = query(
      collection(db, 'claims'),
      where('claimerEmail', '==', input.claimerEmail)
    );
    const snapshot = await getDocs(q);

    const recentClaims = snapshot.docs.filter(
      (doc) => (doc.data().claimedAt || '') > oneDayAgo
    );

    if (recentClaims.length >= 5) {
      return {
        name: 'Rate Limit Check',
        status: 'fail',
        message: `This user submitted ${recentClaims.length} claims in the last 24 hours — possible abuse.`,
        severity: 'major',
      };
    }
    if (recentClaims.length >= 3) {
      return {
        name: 'Rate Limit Check',
        status: 'warn',
        message: `${recentClaims.length} claims in 24 hours — above average activity.`,
        severity: 'major',
      };
    }
    return {
      name: 'Rate Limit Check',
      status: 'pass',
      message: `${recentClaims.length} claim(s) in the last 24 hours — normal activity.`,
      severity: 'major',
    };
  } catch {
    return {
      name: 'Rate Limit Check',
      status: 'warn',
      message: 'Could not verify claim rate.',
      severity: 'major',
    };
  }
}

/**
 * Check 3: Competing claims — are there other pending claims on this item?
 */
async function checkCompetingClaims(input: ClaimInput): Promise<VerificationCheck> {
  try {
    const q = query(
      collection(db, 'claims'),
      where('itemId', '==', input.itemId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.size > 0) {
      return {
        name: 'Competing Claims',
        status: 'warn',
        message: `${snapshot.size} other pending claim(s) exist for this item — requires manual review.`,
        severity: 'major',
      };
    }
    return {
      name: 'Competing Claims',
      status: 'pass',
      message: 'No other pending claims for this item.',
      severity: 'major',
    };
  } catch {
    return {
      name: 'Competing Claims',
      status: 'warn',
      message: 'Could not check competing claims.',
      severity: 'major',
    };
  }
}

/**
 * Check 4: Item availability — is the item still available to claim?
 */
function checkItemAvailability(input: ClaimInput): VerificationCheck {
  if (input.item.status === 'claimed') {
    return {
      name: 'Item Availability',
      status: 'fail',
      message: 'This item has already been claimed by someone else.',
      severity: 'critical',
    };
  }
  if (input.item.status === 'pending') {
    return {
      name: 'Item Availability',
      status: 'warn',
      message: 'This item has a pending claim being reviewed.',
      severity: 'major',
    };
  }
  return {
    name: 'Item Availability',
    status: 'pass',
    message: 'Item is available for claiming.',
    severity: 'critical',
  };
}

/**
 * Check 5: Self-claim — is the claimer also the person who reported the item?
 */
async function checkSelfClaim(input: ClaimInput): Promise<VerificationCheck> {
  try {
    // Check if the item was reported by the same user
    const q = query(
      collection(db, 'foundItems'),
      where('__name__', '==', input.itemId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const itemData = snapshot.docs[0].data();
      if (
        input.userId &&
        itemData.createdBy === input.userId
      ) {
        return {
          name: 'Self-Claim Detection',
          status: 'fail',
          message: 'The claimer is the same person who reported finding this item.',
          severity: 'critical',
        };
      }
      if (
        itemData.createdByEmail &&
        itemData.createdByEmail.toLowerCase() === input.claimerEmail.toLowerCase()
      ) {
        return {
          name: 'Self-Claim Detection',
          status: 'fail',
          message: 'The claimer email matches the person who reported this item.',
          severity: 'critical',
        };
      }
    }
    return {
      name: 'Self-Claim Detection',
      status: 'pass',
      message: 'Claimer is not the item reporter.',
      severity: 'critical',
    };
  } catch {
    return {
      name: 'Self-Claim Detection',
      status: 'warn',
      message: 'Could not verify self-claim status.',
      severity: 'critical',
    };
  }
}

/**
 * Check 6: Security answer quality — did the claimer provide meaningful answers?
 */
function checkSecurityAnswerQuality(input: ClaimInput): VerificationCheck {
  const answers = Object.values(input.securityAnswers).filter((a) => a.trim() !== '');
  const totalQuestions = Object.keys(input.securityAnswers).length || 1;
  const answeredRatio = answers.length / totalQuestions;

  // Check for very short/generic answers
  const suspiciousAnswers = answers.filter(
    (a) => a.trim().length < 3 || ['yes', 'no', 'idk', 'none', 'na', 'n/a', 'maybe'].includes(a.trim().toLowerCase())
  );

  if (answers.length < 2) {
    return {
      name: 'Answer Quality',
      status: 'fail',
      message: `Only ${answers.length} security question(s) answered — insufficient for verification.`,
      severity: 'major',
    };
  }

  if (suspiciousAnswers.length > answers.length / 2) {
    return {
      name: 'Answer Quality',
      status: 'warn',
      message: `${suspiciousAnswers.length} of ${answers.length} answers are very generic/short — possible guessing.`,
      severity: 'major',
    };
  }

  // Check if answers have specificity (longer = more specific)
  const avgLength = answers.reduce((sum, a) => sum + a.length, 0) / answers.length;
  if (avgLength > 15 && answeredRatio >= 0.6) {
    return {
      name: 'Answer Quality',
      status: 'pass',
      message: `${answers.length} detailed answers provided (avg ${Math.round(avgLength)} chars) — good specificity.`,
      severity: 'major',
    };
  }

  return {
    name: 'Answer Quality',
    status: 'pass',
    message: `${answers.length} answers provided with moderate detail.`,
    severity: 'major',
  };
}

/**
 * Check 7: Description quality — did the claimer provide a meaningful identification description?
 */
function checkDescriptionQuality(input: ClaimInput): VerificationCheck {
  const desc = input.claimerDescription.trim();

  if (!desc || desc.length < 5) {
    return {
      name: 'Description Quality',
      status: 'warn',
      message: 'No meaningful identification description provided.',
      severity: 'minor',
    };
  }
  if (desc.length < 20) {
    return {
      name: 'Description Quality',
      status: 'warn',
      message: 'Very short description — limited verification value.',
      severity: 'minor',
    };
  }
  if (desc.length >= 50) {
    return {
      name: 'Description Quality',
      status: 'pass',
      message: `Detailed description provided (${desc.length} chars) — strong identification signal.`,
      severity: 'minor',
    };
  }
  return {
    name: 'Description Quality',
    status: 'pass',
    message: `Description provided (${desc.length} chars).`,
    severity: 'minor',
  };
}

/**
 * Check 8: Proof of ownership — did the claimer upload any proof images?
 */
function checkProofOfOwnership(input: ClaimInput): VerificationCheck {
  if (input.proofImages.length >= 2) {
    return {
      name: 'Proof of Ownership',
      status: 'pass',
      message: `${input.proofImages.length} proof image(s) uploaded — strong evidence.`,
      severity: 'minor',
    };
  }
  if (input.proofImages.length === 1) {
    return {
      name: 'Proof of Ownership',
      status: 'pass',
      message: '1 proof image uploaded.',
      severity: 'minor',
    };
  }
  return {
    name: 'Proof of Ownership',
    status: 'warn',
    message: 'No proof images uploaded — consider requesting evidence.',
    severity: 'minor',
  };
}

/**
 * Check 9: User history — has the user had rejected claims before?
 */
async function checkUserHistory(input: ClaimInput): Promise<VerificationCheck> {
  try {
    const q = query(
      collection(db, 'claims'),
      where('claimerEmail', '==', input.claimerEmail),
      where('status', '==', 'rejected')
    );
    const snapshot = await getDocs(q);

    if (snapshot.size >= 3) {
      return {
        name: 'User Claim History',
        status: 'fail',
        message: `This user has ${snapshot.size} previously rejected claims — repeated fraudulent behavior.`,
        severity: 'major',
      };
    }
    if (snapshot.size >= 1) {
      return {
        name: 'User Claim History',
        status: 'warn',
        message: `This user has ${snapshot.size} previously rejected claim(s) — exercise caution.`,
        severity: 'major',
      };
    }
    return {
      name: 'User Claim History',
      status: 'pass',
      message: 'No previously rejected claims from this user.',
      severity: 'major',
    };
  } catch {
    return {
      name: 'User Claim History',
      status: 'warn',
      message: 'Could not verify user claim history.',
      severity: 'major',
    };
  }
}

// =============================================
//  LOCAL SCORING (non-AI)
// =============================================

function calculateLocalVerificationScore(
  item: FoundItem,
  securityAnswers: Record<string, string>,
  claimerDescription: string
): number {
  let score = 0;
  let maxScore = 0;

  // Word overlap between description and item
  const descWords = (item.description || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const claimWords = claimerDescription.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  if (descWords.length > 0 && claimWords.length > 0) {
    maxScore += 30;
    let matches = 0;
    for (const w of claimWords) {
      if (descWords.some((d) => d.includes(w) || w.includes(d))) matches++;
    }
    score += Math.round((matches / Math.max(claimWords.length, descWords.length)) * 30);
  }

  // Security answer matching
  const answers = Object.values(securityAnswers).filter((a) => a.trim().length > 0);
  const itemDesc = item.description.toLowerCase();

  maxScore += 40;
  let answerPoints = 0;
  for (const answer of answers) {
    const answerWords = answer.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    for (const w of answerWords) {
      if (itemDesc.includes(w)) {
        answerPoints += 5;
      }
    }
  }
  score += Math.min(answerPoints, 40);

  // Answer count bonus
  maxScore += 20;
  score += Math.min(answers.length * 5, 20);

  // Description length bonus
  maxScore += 10;
  if (claimerDescription.length > 100) score += 10;
  else if (claimerDescription.length > 50) score += 7;
  else if (claimerDescription.length > 20) score += 4;

  return Math.round((score / Math.max(maxScore, 100)) * 100);
}

// =============================================
//  MAIN VERIFICATION PIPELINE
// =============================================

/**
 * Run the full claim verification pipeline.
 * Returns a decision: auto_approved, pending_review, or auto_rejected.
 */
export async function verifyClaim(input: ClaimInput): Promise<ClaimVerificationResult> {
  const startTime = performance.now();
  const checks: VerificationCheck[] = [];
  let aiVerification: AIClaimVerification | null = null;

  // ---- Run all checks in parallel ----
  const [
    duplicateCheck,
    floodCheck,
    competingCheck,
    selfClaimCheck,
    userHistoryCheck,
  ] = await Promise.all([
    checkDuplicateClaim(input),
    checkClaimFlood(input),
    checkCompetingClaims(input),
    checkSelfClaim(input),
    checkUserHistory(input),
  ]);

  // Sync checks
  const availabilityCheck = checkItemAvailability(input);
  const answerQualityCheck = checkSecurityAnswerQuality(input);
  const descriptionCheck = checkDescriptionQuality(input);
  const proofCheck = checkProofOfOwnership(input);

  checks.push(
    availabilityCheck,
    duplicateCheck,
    selfClaimCheck,
    floodCheck,
    competingCheck,
    userHistoryCheck,
    answerQualityCheck,
    descriptionCheck,
    proofCheck
  );

  // ---- AI Verification (if Groq configured) ----
  let aiScore = -1;
  if (isGrokConfigured()) {
    try {
      const questions =
        categorySecurityQuestions[input.item.category] ||
        categorySecurityQuestions.other;

      aiVerification = await aiVerifyClaim(
        {
          name: input.item.name,
          category: input.item.category,
          description: input.item.description,
          location: input.item.location,
          dateFound: input.item.dateFound,
        },
        {
          description: input.claimerDescription,
          securityAnswers: input.securityAnswers,
          securityQuestions: questions,
        }
      );

      aiScore = aiVerification.verificationScore;

      checks.push({
        name: 'AI Ownership Analysis',
        status:
          aiScore >= 65 ? 'pass' : aiScore >= 35 ? 'warn' : 'fail',
        message: aiVerification.overallAssessment,
        severity: 'major',
      });

      // Add AI red flags as individual checks
      if (aiVerification.redFlags.length > 0) {
        checks.push({
          name: 'AI Red Flags',
          status: 'warn',
          message: aiVerification.redFlags.join('; '),
          severity: 'major',
        });
      }
    } catch (error) {
      console.warn('AI verification failed during claim check:', error);
      checks.push({
        name: 'AI Ownership Analysis',
        status: 'warn',
        message: 'AI verification unavailable — falling back to rule-based checks.',
        severity: 'minor',
      });
    }
  }

  // ---- Calculate overall score ----
  const localScore = calculateLocalVerificationScore(
    input.item,
    input.securityAnswers,
    input.claimerDescription
  );

  let overallScore: number;
  if (aiScore >= 0) {
    // Blend: AI 55%, local 30%, check bonuses 15%
    const checkBonus = calculateCheckBonus(checks);
    overallScore = Math.round(aiScore * 0.55 + localScore * 0.30 + checkBonus * 0.15);
  } else {
    // No AI: local 70%, check bonuses 30%
    const checkBonus = calculateCheckBonus(checks);
    overallScore = Math.round(localScore * 0.70 + checkBonus * 0.30);
  }
  overallScore = Math.max(0, Math.min(100, overallScore));

  // ---- Determine risk level ----
  const criticalFails = checks.filter((c) => c.severity === 'critical' && c.status === 'fail');
  const majorFails = checks.filter((c) => c.severity === 'major' && c.status === 'fail');
  const warnings = checks.filter((c) => c.status === 'warn');

  let riskLevel: ClaimVerificationResult['riskLevel'];
  if (criticalFails.length > 0) riskLevel = 'critical';
  else if (majorFails.length >= 2) riskLevel = 'high';
  else if (majorFails.length >= 1 || warnings.length >= 3) riskLevel = 'medium';
  else riskLevel = 'low';

  // ---- Make decision ----
  let decision: ClaimVerificationResult['decision'];
  let summary: string;

  if (criticalFails.length > 0) {
    // Any critical failure = auto reject
    decision = 'auto_rejected';
    summary = `Claim rejected: ${criticalFails.map((c) => c.message).join(' | ')}`;
  } else if (majorFails.length >= 2) {
    decision = 'auto_rejected';
    summary = `Claim rejected due to multiple major issues: ${majorFails.map((c) => c.name).join(', ')}.`;
  } else if (riskLevel === 'low' && overallScore >= 70 && majorFails.length === 0) {
    // High confidence + no fails = auto approve
    decision = 'auto_approved';
    summary = `Claim auto-approved with ${overallScore}% confidence. All verification checks passed.`;
  } else {
    // Everything else = manual review
    decision = 'pending_review';
    const issues = [...majorFails, ...warnings].map((c) => c.name).join(', ');
    summary = `Claim requires admin review (${overallScore}% score). Flagged: ${issues || 'moderate confidence'}.`;
  }

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    decision,
    overallScore,
    riskLevel,
    checks,
    aiVerification,
    summary,
    timestamp: new Date().toISOString(),
    processingTimeMs,
  };
}

/**
 * Convert check results into a bonus score (0-100).
 */
function calculateCheckBonus(checks: VerificationCheck[]): number {
  let bonus = 100;
  for (const check of checks) {
    if (check.status === 'fail') {
      bonus -= check.severity === 'critical' ? 40 : check.severity === 'major' ? 20 : 10;
    } else if (check.status === 'warn') {
      bonus -= check.severity === 'critical' ? 20 : check.severity === 'major' ? 10 : 5;
    }
  }
  return Math.max(0, bonus);
}
