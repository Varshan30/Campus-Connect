import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Package, ArrowRight, Smartphone, BookOpen, Shirt, Key, CreditCard, Glasses, Backpack, Box, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import TypewriterText from '@/components/TypewriterText';
import ItemCarousel from '@/components/ItemCarousel';
import { Button } from '@/components/ui/button';
import { GradientLinkButton } from '@/components/ui/gradient-button';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { typewriterPhrases, categoryLabels, ItemCategory, FoundItem } from '@/lib/data';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '@/lib/utils';

const categoryIconComponents: Record<ItemCategory, React.ElementType> = {
  electronics: Smartphone,
  books: BookOpen,
  clothing: Shirt,
  keys: Key,
  'id-cards': CreditCard,
  accessories: Glasses,
  bags: Backpack,
  other: Box,
};

const Landing = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimedCount, setClaimedCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [gridColor, setGridColor] = useState('rgb(99, 102, 241)');

  // Detect dark mode for grid color
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setGridColor(isDark ? 'rgb(165, 180, 252)' : 'rgb(99, 102, 241)');

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      setGridColor(dark ? 'rgb(165, 180, 252)' : 'rgb(99, 102, 241)');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Real-time listener for Firestore items
  useEffect(() => {
    const q = query(
      collection(db, 'foundItems'),
      orderBy('dateFound', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoundItem[];
      setItems(fetchedItems);
      setLoading(false);
      
      // Count claimed items
      const claimed = fetchedItems.filter(item => item.status === 'claimed').length;
      setClaimedCount(claimed);
    });

    // Get total users count
    const usersQuery = collection(db, 'userSettings');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setTotalUsers(snapshot.size);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const availableItems = items.filter((item) => item.status === 'available');
  const pendingItems = items.filter((item) => item.status === 'pending');
  const recentItems = items.slice(0, 8);

  // Count items per category (real-time)
  const categoryItemCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<ItemCategory, number>);

  // Get unique locations count
  const uniqueLocations = new Set(items.map(item => item.location)).size;

  const stats = [
    { label: 'Items Returned', value: claimedCount.toString(), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Total Items', value: items.length.toString(), icon: Package, color: 'text-blue-500' },
    { label: 'Active Listings', value: availableItems.length.toString(), icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Grid Background */}
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.02}
          duration={3}
          repeatDelay={1}
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%]",
          )}
        />

        {/* Flickering Grid Background */}
        <FlickeringGrid
          className="absolute inset-0 z-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          squareSize={4}
          gridGap={6}
          color={gridColor}
          maxOpacity={0.15}
          flickerChance={0.1}
        />
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        
        {/* Decorative blobs */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        />

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {loading ? '...' : `${availableItems.length} items waiting to be claimed`}
            </motion.div>

            {/* Main heading */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              Lost something?
              <br />
              <span className="inline-flex items-baseline flex-wrap justify-center">
                <span>Let's&nbsp;</span>
                <TypewriterText phrases={typewriterPhrases} />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Our campus-wide system helps you report lost items, browse found belongings, 
              and reconnect with what matters most.
            </p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/browse">
                <GradientLinkButton size="lg">
                  <Search className="h-4 w-4" />
                  Browse Found Items
                  <ArrowRight className="h-4 w-4" />
                </GradientLinkButton>
              </Link>
              <Link to="/report">
                <GradientLinkButton size="lg">
                  Report Lost Item
                </GradientLinkButton>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group flex flex-col items-center p-6 rounded-2xl bg-card card-shadow border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className={cn("p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform", stat.color.replace('text-', 'bg-') + '/10')}>
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                </div>
                <motion.span 
                  key={stat.value}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="font-display text-3xl font-bold text-foreground"
                >
                  {loading ? '...' : stat.value}
                </motion.span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Items Carousel */}
      <section className="py-16 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ItemCarousel
              items={recentItems}
              title="Recently Found Items"
              onItemClick={(item) => console.log('Clicked:', item)}
            />
          )}

          <div className="mt-8 text-center">
            <Link to="/browse">
              <GradientLinkButton>
                View All Items
                <ArrowRight className="h-4 w-4" />
              </GradientLinkButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 overflow-hidden relative">
        {/* Subtle flickering grid in categories */}
        <FlickeringGrid
          className="absolute inset-0 z-0 [mask-image:linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]"
          squareSize={3}
          gridGap={8}
          color={gridColor}
          maxOpacity={0.08}
          flickerChance={0.05}
        />
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Quick Access
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Browse by Category
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find your lost items faster by browsing through our organized categories.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {Object.entries(categoryLabels).slice(0, 8).map(([key, label], index) => {
              const IconComponent = categoryIconComponents[key as ItemCategory];
              const itemCount = categoryItemCounts[key as ItemCategory] || 0;
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Link
                    to={`/browse?category=${key}`}
                    className="group relative p-6 rounded-2xl bg-card border border-border/50 text-center overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl block h-full"
                  >
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-secondary/[0.02] group-hover:from-primary/10 group-hover:to-secondary/5 transition-all duration-500" />
                    
                    {/* Content */}
                    <div className="relative">
                      {/* Icon container with background */}
                      <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg group-hover:scale-110">
                        <IconComponent className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                      
                      {/* Category label */}
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                        {label}
                      </h3>
                      
                      {/* Item count - real-time */}
                      <motion.span 
                        key={itemCount}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-xs text-muted-foreground"
                      >
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </motion.span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to find your lost belongings or help others.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Report',
                description: 'Report your lost item or submit a found item with details and photos.',
              },
              {
                step: '02',
                title: 'Match',
                description: 'Our system matches lost reports with found items automatically.',
              },
              {
                step: '03',
                title: 'Reunite',
                description: 'Claim your item at the Student Center and verify ownership.',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative p-8 rounded-2xl bg-card card-shadow text-center">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
                  {item.step}
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground mt-4 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 md:p-16 text-center">
            {/* Flickering Grid on CTA */}
            <FlickeringGrid
              className="absolute inset-0 z-0"
              squareSize={4}
              gridGap={6}
              color="rgb(255, 255, 255)"
              maxOpacity={0.2}
              flickerChance={0.15}
            />

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 border-2 border-white rounded-full translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                Found something on campus?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Help a fellow student out. Report found items and be a part of our caring campus community.
              </p>
              <Button asChild size="lg" variant="secondary" className="text-base px-8">
                <Link to="/report">
                  Report Found Item
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Landing;
