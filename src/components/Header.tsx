import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Bell, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { app, db } from '../firebase';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const auth = getAuth(app);

// Admin emails - in production, store this in Firestore or environment
const ADMIN_EMAILS = ['admin@campus.edu', 'admin@university.edu', 'test@test.com'];

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: any;
  userId: string;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Check if user is admin
      if (currentUser) {
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email || ''));
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch notifications for logged in user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const markAsRead = async (notificationId: string) => {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/browse', label: 'Browse Items' },
    { href: '/report', label: 'Report Item' },
    { href: '/settings', label: 'Settings' },
    ...(isAdmin ? [{ href: '/admin/claims', label: 'Admin', icon: Shield }] : []),
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-display text-lg font-extrabold text-foreground">
              Campus Lost & Found
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Popover open={showSearch} onOpenChange={setShowSearch}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Search className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="end">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <GradientButton type="submit" size="sm">Search</GradientButton>
                </form>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b border-border">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 border-b border-border/50 text-sm cursor-pointer hover:bg-muted/50",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2">
                          {!notification.read && (
                            <span className="h-2 w-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <span className={cn(!notification.read && "font-medium")}>
                            {notification.message}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* User info and Logout */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <GradientButton size="sm" onClick={handleLogout}>
                  Logout
                </GradientButton>
              </div>
            ) : (
              <Link to="/auth">
                <GradientButton size="sm" className="hidden sm:flex">
                  Login / Sign Up
                </GradientButton>
              </Link>
            )}
            {user ? (
              <Button size="icon" variant="outline" className="sm:hidden" onClick={handleLogout}>
                <span className="text-xs font-medium">Out</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="icon" variant="outline" className="sm:hidden">
                  <span className="text-xs font-medium">Log</span>
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
