import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          {/* Brand */}
          <div className="md:max-w-xs md:ml-4">
            <h3 className="font-display text-base font-semibold text-foreground mb-2">
              Campus Lost & Found
            </h3>
            <p className="text-sm text-muted-foreground">
              Helping students reconnect with their belongings since 2025.
            </p>
          </div>

          {/* Links Grid */}
          <div className="flex flex-wrap gap-12 md:gap-16">
            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">Browse Items</Link></li>
                <li><Link to="/report" className="text-muted-foreground hover:text-primary transition-colors">Report Item</Link></li>
                <li><Link to="/settings" className="text-muted-foreground hover:text-primary transition-colors">Settings</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                Categories
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Electronics</li>
                <li>Books & Notes</li>
                <li>Clothing</li>
                <li>Keys & IDs</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Student Care Center, Room  TP 101
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  lostandfound@campus.edu
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  +91 9876543210
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Campus Lost & Found. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
