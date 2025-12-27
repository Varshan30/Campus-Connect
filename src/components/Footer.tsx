import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Search className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Campus Lost & Found
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Helping students reconnect with their lost belongings. 
              A community-driven platform for our campus.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Found Items
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="text-muted-foreground hover:text-foreground transition-colors">
                  Report Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="text-muted-foreground hover:text-foreground transition-colors">
                  Report Found Item
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Campus Lost & Found. Built for students, by students.</p>
        </div>
      </div>
    </footer>
  );
}
