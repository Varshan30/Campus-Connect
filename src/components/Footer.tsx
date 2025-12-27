import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-muted-foreground hover:text-foreground transition-colors">
                  Report Item
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Categories</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Electronics</li>
              <li>Books & Notes</li>
              <li>Clothing</li>
              <li>Keys & IDs</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-2">
            <h4 className="font-semibold text-foreground mb-3">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Student Center, Room 101</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>lostandfound@campus.edu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>(555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Campus Lost & Found
          </p>
          <p className="text-xs text-muted-foreground">
            Helping students reconnect with their belongings
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
