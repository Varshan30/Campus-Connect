export interface FoundItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  location: CampusLocation;
  dateFound: string;
  image: string;
  status: 'available' | 'claimed' | 'pending';
}

export type ItemCategory = 
  | 'electronics'
  | 'books'
  | 'clothing'
  | 'keys'
  | 'id-cards'
  | 'accessories'
  | 'bags'
  | 'other';

export type CampusLocation =
  | 'library'
  | 'student-center'
  | 'gymnasium'
  | 'cafeteria'
  | 'science-building'
  | 'arts-building'
  | 'dormitory'
  | 'parking-lot'
  | 'sports-field'
  | 'other';

export const categoryLabels: Record<ItemCategory, string> = {
  electronics: 'Electronics',
  books: 'Books',
  clothing: 'Clothing',
  keys: 'Keys',
  'id-cards': 'ID Cards',
  accessories: 'Accessories',
  bags: 'Bags',
  other: 'Other',
};

export const locationLabels: Record<CampusLocation, string> = {
  library: 'Library',
  'student-center': 'Student Center',
  gymnasium: 'Gymnasium',
  cafeteria: 'Cafeteria',
  'science-building': 'Science Building',
  'arts-building': 'Arts Building',
  dormitory: 'Dormitory',
  'parking-lot': 'Parking Lot',
  'sports-field': 'Sports Field',
  other: 'Other',
};

export const categoryIcons: Record<ItemCategory, string> = {
  electronics: '📱',
  books: '📚',
  clothing: '👕',
  keys: '🔑',
  'id-cards': '🪪',
  accessories: '👓',
  bags: '🎒',
  other: '📦',
};

export const foundItems: FoundItem[] = [
  {
    id: '1',
    name: 'MacBook Pro Charger',
    category: 'electronics',
    description: 'White 96W USB-C power adapter with cable',
    location: 'library',
    dateFound: '2024-01-15',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '2',
    name: 'Blue Hydroflask',
    category: 'accessories',
    description: '32oz insulated water bottle, navy blue with stickers',
    location: 'gymnasium',
    dateFound: '2024-01-14',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '3',
    name: 'Psychology Textbook',
    category: 'books',
    description: 'Introduction to Psychology, 5th Edition by James Kalat',
    location: 'cafeteria',
    dateFound: '2024-01-13',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '4',
    name: 'Black North Face Jacket',
    category: 'clothing',
    description: 'Medium size, black puffer jacket with hood',
    location: 'student-center',
    dateFound: '2024-01-12',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
    status: 'pending',
  },
  {
    id: '5',
    name: 'Car Keys with Fob',
    category: 'keys',
    description: 'Toyota key fob with house key and gym membership tag',
    location: 'parking-lot',
    dateFound: '2024-01-11',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '6',
    name: 'Student ID Card',
    category: 'id-cards',
    description: 'University student ID, found near entrance',
    location: 'science-building',
    dateFound: '2024-01-10',
    image: 'https://images.unsplash.com/photo-1578670812003-60745e2c2ea9?w=400&h=300&fit=crop',
    status: 'claimed',
  },
  {
    id: '7',
    name: 'AirPods Pro Case',
    category: 'electronics',
    description: 'White AirPods Pro charging case, no earbuds inside',
    location: 'library',
    dateFound: '2024-01-09',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '8',
    name: 'Fjallraven Backpack',
    category: 'bags',
    description: 'Classic Kanken backpack in forest green',
    location: 'arts-building',
    dateFound: '2024-01-08',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '9',
    name: 'Ray-Ban Sunglasses',
    category: 'accessories',
    description: 'Classic Wayfarer style, black frame',
    location: 'sports-field',
    dateFound: '2024-01-07',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '10',
    name: 'Scientific Calculator',
    category: 'electronics',
    description: 'TI-84 Plus graphing calculator',
    location: 'science-building',
    dateFound: '2024-01-06',
    image: 'https://images.unsplash.com/photo-1564473185935-5da0540b7ea8?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '11',
    name: 'Dorm Room Key',
    category: 'keys',
    description: 'Silver key with blue lanyard attached',
    location: 'dormitory',
    dateFound: '2024-01-05',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop',
    status: 'available',
  },
  {
    id: '12',
    name: 'Laptop Sleeve',
    category: 'bags',
    description: '13-inch gray neoprene laptop sleeve',
    location: 'library',
    dateFound: '2024-01-04',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=300&fit=crop',
    status: 'available',
  },
];

export const typewriterPhrases = [
  "find your belongings",
  "help others reconnect",
  "build campus community",
  "make a difference",
  "return what's lost",
];
