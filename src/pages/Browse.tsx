import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, app } from '../firebase';
import { collection, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Search, Filter, X, SlidersHorizontal, MapPin, Tag, CheckCircle2, Loader2, Package, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import ItemCard from '@/components/ItemCard';
import EditItemDialog from '@/components/EditItemDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  categoryLabels,
  locationLabels,
  ItemCategory,
  CampusLocation,
} from '@/lib/data';

const auth = getAuth(app);

const Browse = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'pending' | 'claimed'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for items
  useEffect(() => {
    const q = query(collection(db, 'foundItems'), orderBy('dateFound', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update search query when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Delete item handler
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'foundItems', id));
    setItems(items => items.filter(item => item.id !== id));
  };

  // Edit item handler - opens dialog
  const handleEdit = (item: any) => {
    setEditItem(item);
  };

  // Handler for when item is updated
  const handleItemUpdated = (updatedItem: any) => {
    setItems(items => items.map(i => i.id === updatedItem.id ? updatedItem : i));
    setEditItem(null);
  };

  // Handler for when item is claimed
  const handleClaimSubmitted = (itemId: string) => {
    setItems(items => items.map(i => i.id === itemId ? { ...i, status: 'pending' } : i));
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedLocation, selectedStatus]);

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedLocation !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const FilterControls = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="group">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </div>
          <label className="text-sm font-semibold text-foreground">Category</label>
        </div>
        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ItemCategory | 'all')}>
          <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="group">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-accent/10 text-accent-foreground">
            <MapPin className="h-4 w-4" />
          </div>
          <label className="text-sm font-semibold text-foreground">Location</label>
        </div>
        <Select value={selectedLocation} onValueChange={(v) => setSelectedLocation(v as CampusLocation | 'all')}>
          <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {Object.entries(locationLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="group">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-secondary/50 text-secondary-foreground">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <label className="text-sm font-semibold text-foreground">Status</label>
        </div>
        <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
          <SelectTrigger className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          onClick={clearFilters} 
          className="w-full group/btn hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <X className="h-4 w-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-200" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Header with Stats */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 relative overflow-hidden">
        <AnimatedGridPattern
          numSquares={20}
          maxOpacity={0.02}
          duration={4}
          className={cn(
            "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          )}
        />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Browse Found Items
              </h1>
              <p className="text-muted-foreground">
                {loading ? 'Loading...' : `${filteredItems.length} items found`}
              </p>
            </div>
            
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <motion.span 
                  key={items.filter(i => i.status === 'available').length}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-sm font-medium text-green-600 dark:text-green-400"
                >
                  {items.filter(i => i.status === 'available').length} Available
                </motion.span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Package className="h-4 w-4 text-yellow-500" />
                <motion.span 
                  key={items.filter(i => i.status === 'pending').length}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-sm font-medium text-yellow-600 dark:text-yellow-400"
                >
                  {items.filter(i => i.status === 'pending').length} Pending
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 rounded-2xl bg-gradient-to-b from-card to-card/80 border border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">Filters</h3>
                    <p className="text-xs text-muted-foreground">Refine your search</p>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-auto bg-primary text-primary-foreground">{activeFiltersCount}</Badge>
                  )}
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <FilterControls />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search & Mobile Filter */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden relative">
                    <Filter className="h-5 w-5" />
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterControls />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryLabels[selectedCategory]}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedCategory('all')}
                    />
                  </Badge>
                )}
                {selectedLocation !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {locationLabels[selectedLocation]}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedLocation('all')}
                    />
                  </Badge>
                )}
                {selectedStatus !== 'all' && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {selectedStatus}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedStatus('all')}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Items Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    layout
                  >
                    <ItemCard 
                      item={item} 
                      onDelete={currentUser && item.createdBy === currentUser.uid ? handleDelete : undefined} 
                      onEdit={currentUser && item.createdBy === currentUser.uid ? handleEdit : undefined} 
                      onClaimSubmitted={handleClaimSubmitted}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No items found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Item Dialog */}
      {editItem && (
        <EditItemDialog
          item={editItem}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </Layout>
  );
};

export default Browse;
