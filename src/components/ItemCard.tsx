import { FoundItem, categoryLabels, locationLabels } from "@/types/items";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ItemCardProps {
  item: FoundItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const statusColors = {
    available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    claimed: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="group card-hover overflow-hidden border-border/50 bg-card min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3">
          <Badge className={statusColors[item.status]}>
            {item.status === "available" ? "Available" : item.status === "pending" ? "Pending Claim" : "Claimed"}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-foreground line-clamp-1">{item.name}</h3>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {categoryLabels[item.category]}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {locationLabels[item.location]}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(item.dateFound).toLocaleDateString()}
          </span>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full gap-2 group/btn">
          <Link to={`/item/${item.id}`}>
            View Details
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
