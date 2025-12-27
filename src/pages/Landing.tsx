import { Link } from 'react-router-dom';
import { Search, MapPin, Package, ArrowRight, Smartphone, BookOpen, Shirt, Key, CreditCard, Glasses, Backpack, Box } from 'lucide-react';
import Layout from '@/components/Layout';
import TypewriterText from '@/components/TypewriterText';
import ItemCarousel from '@/components/ItemCarousel';
import { Button } from '@/components/ui/button';
import { foundItems, typewriterPhrases, categoryLabels, ItemCategory } from '@/lib/data';

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
  const availableItems = foundItems.filter((item) => item.status === 'available');
  const recentItems = foundItems.slice(0, 8);

  // Count items per category
  const categoryItemCounts = foundItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<ItemCategory, number>);

  const stats = [
    { label: 'Items Returned', value: '1,247', icon: Package },
    { label: 'Campus Locations', value: '10', icon: MapPin },
    { label: 'Active Listings', value: availableItems.length.toString(), icon: Search },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        
        {/* Decorative blobs - using transform for GPU acceleration */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl will-change-transform" style={{ animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl will-change-transform" style={{ animation: 'float 6s ease-in-out infinite 2s' }} />

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {availableItems.length} items waiting to be claimed
            </div>

            {/* Main heading */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8 glow">
                <Link to="/browse">
                  Browse Found Items
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/report">Report Lost Item</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center p-6 rounded-2xl bg-card card-shadow"
              >
                <stat.icon className="h-8 w-8 text-primary mb-3" />
                <span className="font-display text-3xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Items Carousel */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <ItemCarousel
            items={recentItems}
            title="Recently Found Items"
            onItemClick={(item) => console.log('Clicked:', item)}
          />

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/browse">
                View All Items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Quick Access
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Browse by Category
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find your lost items faster by browsing through our organized categories.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {Object.entries(categoryLabels).slice(0, 8).map(([key, label], index) => {
              const IconComponent = categoryIconComponents[key as ItemCategory];
              const itemCount = categoryItemCounts[key as ItemCategory] || 0;
              
              return (
                <Link
                  key={key}
                  to={`/browse?category=${key}`}
                  className="group relative p-6 rounded-2xl bg-card border border-border/50 text-center overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-2"
                  style={{ animationDelay: `${index * 75}ms` }}
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
                    
                    {/* Item count */}
                    <span className="text-xs text-muted-foreground">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </Link>
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
