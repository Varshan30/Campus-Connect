import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  User,
  Package,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain,
  Shield,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryLabels, locationLabels, ItemCategory, CampusLocation } from '@/lib/data';

interface Claim {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory?: ItemCategory;
  itemDescription?: string;
  claimerName: string;
  claimerEmail: string;
  claimerPhone?: string;
  identificationDescription?: string;
  securityAnswers?: Record<string, string>;
  proofImages?: string[];
  matchScore?: {
    score: number;
    maxScore: number;
    percentage: number;
    riskLevel: 'low' | 'medium' | 'high';
    breakdown?: { category: string; points: number; maxPoints: number; details: string }[];
    aiPowered?: boolean;
    aiInsights?: {
      reasoning: string;
      overallAssessment: string;
      redFlags: string[];
      positiveIndicators: string[];
      confidence: string;
    };
  };
  verification?: {
    decision: 'auto_approved' | 'auto_rejected' | 'pending_review';
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    checks: { name: string; status: 'pass' | 'fail' | 'warn'; message: string; severity: string }[];
    summary: string;
    aiPowered: boolean;
    aiInsights?: {
      reasoning: string;
      overallAssessment: string;
      redFlags: string[];
      positiveIndicators: string[];
      confidence: string;
    } | null;
    processingTimeMs: number;
  };
  claimedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
}

interface FoundItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  location: CampusLocation;
  dateFound: string;
  image: string;
  status: 'available' | 'claimed' | 'pending';
}

// Admin emails - in production, store this in Firestore or environment
const ADMIN_EMAILS = ['admin@campus.edu', 'admin@university.edu', 'test@test.com'];

const AdminClaims = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = getAuth();
  
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [items, setItems] = useState<Record<string, FoundItem>>({});
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Check auth and admin status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user email is in admin list
        const isAdminUser = ADMIN_EMAILS.includes(currentUser.email || '');
        setIsAdmin(isAdminUser);
        if (!isAdminUser) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this page.',
            variant: 'destructive',
          });
          navigate('/');
        }
      } else {
        navigate('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, navigate, toast]);

  // Fetch claims
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'claims'),
      orderBy('claimedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedClaims = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
      setClaims(fetchedClaims);

      // Fetch related items
      fetchedClaims.forEach(async (claim) => {
        if (!items[claim.itemId]) {
          const itemDoc = await getDoc(doc(db, 'foundItems', claim.itemId));
          if (itemDoc.exists()) {
            setItems(prev => ({
              ...prev,
              [claim.itemId]: { id: itemDoc.id, ...itemDoc.data() } as FoundItem
            }));
          }
        }
      });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleApproveClaim = async (claim: Claim) => {
    setProcessingId(claim.id);
    try {
      // Update claim status
      await updateDoc(doc(db, 'claims', claim.id), {
        status: 'approved',
        processedAt: new Date().toISOString(),
      });

      // Update item status to claimed
      await updateDoc(doc(db, 'foundItems', claim.itemId), {
        status: 'claimed',
      });

      toast({
        title: 'Claim Approved',
        description: `${claim.itemName} has been approved for ${claim.claimerName}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve claim.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClaim = async (claim: Claim) => {
    setProcessingId(claim.id);
    try {
      // Update claim status
      await updateDoc(doc(db, 'claims', claim.id), {
        status: 'rejected',
        processedAt: new Date().toISOString(),
      });

      // Update item status back to available
      await updateDoc(doc(db, 'foundItems', claim.itemId), {
        status: 'available',
      });

      toast({
        title: 'Claim Rejected',
        description: `Claim by ${claim.claimerName} has been rejected.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject claim.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (claimId: string) => {
    setExpandedClaims(prev => {
      const next = new Set(prev);
      if (next.has(claimId)) {
        next.delete(claimId);
      } else {
        next.add(claimId);
      }
      return next;
    });
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">High Risk</Badge>;
      case 'critical':
        return <Badge className="bg-red-600/20 text-red-700 border-red-600/30 font-bold">⚠ Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDecisionBadge = (decision?: string) => {
    switch (decision) {
      case 'auto_approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Auto-Approved</Badge>;
      case 'auto_rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Auto-Rejected</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Needs Review</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (activeTab === 'all') return true;
    return claim.status === activeTab;
  });

  const pendingCount = claims.filter(c => c.status === 'pending').length;
  const approvedCount = claims.filter(c => c.status === 'approved').length;
  const rejectedCount = claims.filter(c => c.status === 'rejected').length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Claims Management
          </h1>
          <p className="text-muted-foreground">
            Review and process item claims. Verify ownership before approving.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{claims.length}</p>
                <p className="text-sm text-muted-foreground">Total Claims</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              Pending {pendingCount > 0 && <Badge variant="secondary">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All Claims</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredClaims.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No claims found</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' ? 'No pending claims to review.' : `No ${activeTab} claims.`}
                </p>
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const item = items[claim.itemId];
                const isExpanded = expandedClaims.has(claim.id);

                return (
                  <div
                    key={claim.id}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    {/* Claim Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {item?.image && (
                          <img
                            src={item.image}
                            alt={claim.itemName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{claim.itemName}</h3>
                            {getStatusBadge(claim.status)}
                            {claim.verification && getDecisionBadge(claim.verification.decision)}
                            {claim.verification ? getRiskBadge(claim.verification.riskLevel) : claim.matchScore && getRiskBadge(claim.matchScore.riskLevel)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {claim.claimerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {claim.claimerEmail}
                            </span>
                            {claim.claimerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {claim.claimerPhone}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Claimed: {new Date(claim.claimedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(claim.verification || claim.matchScore) && (
                          <div className="text-right mr-4">
                            <div className={cn("text-2xl font-bold", 
                              (claim.verification?.overallScore ?? claim.matchScore?.percentage ?? 0) >= 70 ? 'text-green-600' :
                              (claim.verification?.overallScore ?? claim.matchScore?.percentage ?? 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                            )}>
                              {claim.verification?.overallScore ?? claim.matchScore?.percentage}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {claim.verification ? 'Verification' : 'Match'} Score
                            </div>
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(claim.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {claim.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectClaim(claim)}
                              disabled={processingId === claim.id}
                              className="text-destructive border-destructive/50 hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <GradientButton
                              size="sm"
                              onClick={() => handleApproveClaim(claim)}
                              disabled={processingId === claim.id}
                            >
                              {processingId === claim.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </GradientButton>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-border p-4 bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Item Details */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              Item Details
                            </h4>
                            {item ? (
                              <div className="space-y-2 text-sm">
                                <p><span className="text-muted-foreground">Name:</span> {item.name}</p>
                                <p><span className="text-muted-foreground">Category:</span> {categoryLabels[item.category]}</p>
                                <p><span className="text-muted-foreground">Location:</span> {locationLabels[item.location]}</p>
                                <p><span className="text-muted-foreground">Description:</span> {item.description}</p>
                                <p><span className="text-muted-foreground">Date Found:</span> {new Date(item.dateFound).toLocaleDateString()}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Item details not available</p>
                            )}
                          </div>

                          {/* Security Answers */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-primary" />
                              Security Answers
                            </h4>
                            {claim.securityAnswers && Object.keys(claim.securityAnswers).length > 0 ? (
                              <div className="space-y-2 text-sm">
                                {Object.entries(claim.securityAnswers).map(([key, value]) => (
                                  <p key={key}>
                                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                    <span className="font-medium">{value}</span>
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No security answers provided</p>
                            )}
                          </div>

                          {/* Match Score Breakdown */}
                          {claim.matchScore?.breakdown && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-primary" />
                                Score Breakdown
                                {claim.matchScore?.aiPowered && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-medium">
                                    <Brain className="h-3 w-3" /> AI-Enhanced
                                  </span>
                                )}
                              </h4>
                              <div className="space-y-2">
                                {claim.matchScore.breakdown.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{item.category}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full",
                                            item.points / item.maxPoints >= 0.7 ? "bg-green-500" :
                                            item.points / item.maxPoints >= 0.4 ? "bg-yellow-500" : "bg-red-500"
                                          )}
                                          style={{ width: `${(item.points / item.maxPoints) * 100}%` }}
                                        />
                                      </div>
                                      <span className="font-medium w-12 text-right">{item.points}/{item.maxPoints}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Verification Pipeline Results */}
                          {claim.verification && (
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                Verification Pipeline
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Timer className="h-3 w-3" /> {claim.verification.processingTimeMs}ms
                                </span>
                                {claim.verification.aiPowered && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-medium">
                                    <Brain className="h-3 w-3" /> AI-Powered
                                  </span>
                                )}
                              </h4>
                              <div className="p-3 rounded-lg bg-muted/50 text-sm mb-3">
                                <p className="text-muted-foreground">{claim.verification.summary}</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {claim.verification.checks.map((check, idx) => (
                                  <div key={idx} className={cn(
                                    "flex items-start gap-2 p-2.5 rounded-lg border text-sm",
                                    check.status === 'pass' ? 'bg-green-500/5 border-green-500/20' :
                                    check.status === 'warn' ? 'bg-yellow-500/5 border-yellow-500/20' :
                                    'bg-red-500/5 border-red-500/20'
                                  )}>
                                    {check.status === 'pass' ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    ) : check.status === 'warn' ? (
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                    )}
                                    <div>
                                      <div className="font-medium text-foreground flex items-center gap-1.5">
                                        {check.name}
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{check.severity}</Badge>
                                      </div>
                                      <p className="text-muted-foreground text-xs mt-0.5">{check.message}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Insights Panel */}
                          {(claim.verification?.aiInsights || claim.matchScore?.aiInsights) && (
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-purple-500" />
                                AI Verification Insights
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                                  {(claim.verification?.aiInsights || claim.matchScore?.aiInsights)?.confidence} confidence
                                </span>
                              </h4>
                              {(() => {
                                const insights = claim.verification?.aiInsights || claim.matchScore?.aiInsights;
                                if (!insights) return null;
                                return (
                                  <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                      <p className="font-medium text-foreground mb-1">Assessment</p>
                                      <p className="text-muted-foreground">{insights.overallAssessment}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                      <p className="font-medium text-foreground mb-1">Reasoning</p>
                                      <p className="text-muted-foreground">{insights.reasoning}</p>
                                    </div>
                                    {insights.positiveIndicators.length > 0 && (
                                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm">
                                        <p className="font-medium text-green-700 dark:text-green-400 mb-1">✅ Positive Indicators</p>
                                        <ul className="text-muted-foreground space-y-0.5">
                                          {insights.positiveIndicators.map((indicator, i) => (
                                            <li key={i}>• {indicator}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {insights.redFlags.length > 0 && (
                                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm">
                                        <p className="font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Red Flags</p>
                                        <ul className="text-muted-foreground space-y-0.5">
                                          {insights.redFlags.map((flag, i) => (
                                            <li key={i}>• {flag}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Proof Images */}
                          {claim.proofImages && claim.proofImages.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                Proof of Ownership ({claim.proofImages.length})
                              </h4>
                              <div className="flex gap-2 flex-wrap">
                                {claim.proofImages.map((img, idx) => (
                                  <a
                                    key={idx}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={img}
                                      alt={`Proof ${idx + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border border-border hover:border-primary transition-colors"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Claimant Description */}
                          {claim.identificationDescription && (
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-foreground mb-2">Claimant's Description</h4>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                "{claim.identificationDescription}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminClaims;
