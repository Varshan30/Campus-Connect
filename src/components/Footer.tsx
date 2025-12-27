import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
                L&F
              </div>
              <span className="font-display text-lg font-semibold text-foreground">
                Campus L&F
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Helping students reconnect with their belongings since 2024.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-muted-foreground hover:text-primary transition-colors">
                  Report Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-muted-foreground hover:text-primary transition-colors">
                  Report Found Item
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-primary transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Electronics</li>
              <li className="text-muted-foreground">Books & Notes</li>
              <li className="text-muted-foreground">Clothing</li>
              <li className="text-muted-foreground">Keys & ID Cards</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Student Center, Room 101
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                lostandfound@campus.edu
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                (555) 123-4567
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Campus Lost & Found. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
