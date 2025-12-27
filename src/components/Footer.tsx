import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { label: 'Browse Items', to: '/browse' },
    { label: 'Report Item', to: '/report' },
    { label: 'Settings', to: '/settings' },
  ];

  const categories = ['Electronics', 'Books & Notes', 'Clothing', 'Keys & IDs'];

  const contactInfo = [
    { icon: MapPin, text: 'Student Center, Room 101' },
    { icon: Mail, text: 'lostandfound@campus.edu' },
    { icon: Phone, text: '(555) 123-4567' },
  ];

  return (
    <footer className="relative bg-card border-t border-border mt-auto overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative container mx-auto px-6 py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          
          {/* Brand Section */}
          <div className="md:col-span-4">
            <h3 className="font-display text-lg font-bold text-foreground mb-3">
              Campus Lost & Found
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Helping students reconnect with their belongings since 2024.
            </p>
          </div>

          {/* Links Section */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Section */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Categories
            </h4>
            <ul className="space-y-3">
              {categories.map((cat) => (
                <li key={cat} className="text-sm text-muted-foreground">
                  {cat}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3">
              {contactInfo.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 mt-0.5 text-primary/70 shrink-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Campus Lost & Found. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
