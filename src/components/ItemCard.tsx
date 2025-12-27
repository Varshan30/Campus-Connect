import { MapPin, Calendar } from 'lucide-react';
import { FoundItem, categoryIcons, locationLabels } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: FoundItem;
  onClick?: () => void;
  className?: string;
}

const ItemCard = ({ item, onClick, className }: ItemCardProps) => {
  const statusColors = {
    available: 'bg-secondary text-secondary-foreground',
    claimed: 'bg-muted text-muted-foreground',
    pending: 'bg-accent text-accent-foreground',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden card-hover cursor-pointer border-border/50',
        'bg-card card-shadow',
        className
      )}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="glass text-xs font-medium">
            {categoryIcons[item.category]} {item.category}
          </Badge>
        </div>
        
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <Badge className={cn('text-xs font-medium capitalize', statusColors[item.status])}>
            {item.status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>
        
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locationLabels[item.location]}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(item.dateFound)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          size="sm"
          className="w-full"
          variant={item.status === 'available' ? 'default' : 'secondary'}
          disabled={item.status === 'claimed'}
        >
          {item.status === 'available' && 'Claim Item'}
          {item.status === 'pending' && 'Pending Claim'}
          {item.status === 'claimed' && 'Already Claimed'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
