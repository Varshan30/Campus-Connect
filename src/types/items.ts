export interface FoundItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  location: CampusLocation;
  dateFound: string;
  imageUrl: string;
  status: "available" | "claimed" | "pending";
  contactEmail?: string;
}

export interface LostItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  lastSeenLocation: CampusLocation;
  dateLost: string;
  imageUrl?: string;
  status: "searching" | "found" | "closed";
  contactEmail: string;
}

export type ItemCategory =
  | "electronics"
  | "books"
  | "clothing"
  | "keys"
  | "id-cards"
  | "accessories"
  | "bags"
  | "sports"
  | "other";

export type CampusLocation =
  | "library"
  | "student-center"
  | "gymnasium"
  | "cafeteria"
  | "dorms"
  | "science-building"
  | "arts-building"
  | "parking-lot"
  | "sports-field"
  | "other";

export const categoryLabels: Record<ItemCategory, string> = {
  electronics: "Electronics",
  books: "Books & Notes",
  clothing: "Clothing",
  keys: "Keys",
  "id-cards": "ID Cards",
  accessories: "Accessories",
  bags: "Bags & Backpacks",
  sports: "Sports Equipment",
  other: "Other",
};

export const locationLabels: Record<CampusLocation, string> = {
  library: "Main Library",
  "student-center": "Student Center",
  gymnasium: "Gymnasium",
  cafeteria: "Cafeteria",
  dorms: "Dormitories",
  "science-building": "Science Building",
  "arts-building": "Arts Building",
  "parking-lot": "Parking Lot",
  "sports-field": "Sports Field",
  other: "Other Location",
};

export const categoryIcons: Record<ItemCategory, string> = {
  electronics: "💻",
  books: "📚",
  clothing: "👕",
  keys: "🔑",
  "id-cards": "🪪",
  accessories: "👓",
  bags: "🎒",
  sports: "⚽",
  other: "📦",
};
