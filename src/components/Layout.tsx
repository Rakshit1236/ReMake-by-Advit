import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Recycle, User, Plus, LayoutDashboard, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Recycle className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">ReWear</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/browse" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/browse') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Browse Items
              </Link>
              {user && (
                <>
                  <Link 
                    to="/list-item" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/list-item') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    List Item
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/list-item">
                    <Button size="sm" className="hidden md:inline-flex">
                      <Plus className="h-4 w-4 mr-2" />
                      List Item
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/browse">
                    <Button size="sm">Browse Items</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main>{children}</main>
    </div>
  );
};