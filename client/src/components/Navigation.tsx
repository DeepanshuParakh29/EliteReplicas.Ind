import { useState, Fragment } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, Menu, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import SearchModal from "@/components/SearchModal";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { itemCount, setIsOpen: setCartOpen } = useCart();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  const handleSignOut = () => {
    signOut();
    closeMobileMenu();
  };

  return (
    <Fragment>
      <nav className="fixed top-0 w-full z-50 bg-deep-charcoal/80 backdrop-blur-md shadow-lg glass-effect border-b border-matte-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-matte-gold to-yellow-400 rounded-full flex items-center justify-center">
                  <Crown className="text-rich-black w-4 h-4" />
                </div>
                <h1 className="font-playfair text-2xl font-bold text-matte-gold">EliteReplicas.In</h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`text-base font-medium hover:text-matte-gold transition-colors duration-200 ${
                    location === item.href ? "text-matte-gold" : "text-cream-white/80"
                  }`} 
                >
                
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchModalOpen(true)}
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-cream-white" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative"
                aria-label="Shopping cart"
              >
                <ShoppingBag className="w-5 h-5 text-cream-white" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-matte-gold text-rich-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
              
              <div className="hidden md:block">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-cream-white/80">Welcome</span>
                    <span className="text-sm text-matte-gold">{user.email?.split('@')[0]}</span>
                    {user.role === "admin" || user.role === "super_admin" ? (
                      <Link
                        href="/admin"
                        className="text-sm text-cream-white/80 hover:text-matte-gold px-3 py-1 rounded-full"
                      >
                        Admin Panel
                      </Link>
                    ) : null}
                    <Link
                      href="/profile"
                      className="text-sm text-cream-white/80 hover:text-matte-gold px-3 py-1 rounded-full"
                    >
                      Profile
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-sm text-cream-white/80 hover:text-matte-gold px-3 py-1 rounded-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-sm text-cream-white/80 hover:text-matte-gold px-3 py-1 rounded-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-rich-black/95 z-40 md:hidden">
          <div className="flex flex-col h-full pt-16">
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="space-y-6">
                {/* Navigation Links */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`block text-lg font-medium hover:text-matte-gold transition-colors duration-200 ${
                      location === item.href ? "text-matte-gold" : "text-cream-white/80"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* User Actions for Mobile */}
                <div className="pt-6 border-t border-matte-gold/10 space-y-4">
                  {user ? (
                    <>
                      <div className="text-cream-white/80">
                        <span className="text-sm">Welcome, </span>
                        <span className="text-matte-gold font-medium">{user.email?.split('@')[0]}</span>
                      </div>
                      
                      {user.role === "admin" || user.role === "super_admin" ? (
                        <Link
                          href="/admin"
                          onClick={closeMobileMenu}
                          className="block text-lg font-medium text-cream-white/80 hover:text-matte-gold transition-colors duration-200"
                        >
                          Admin Panel
                        </Link>
                      ) : null}
                      
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className="block text-lg font-medium text-cream-white/80 hover:text-matte-gold transition-colors duration-200"
                      >
                        Profile
                      </Link>
                      
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="text-lg font-medium text-cream-white/80 hover:text-matte-gold transition-colors duration-200 p-0 h-auto justify-start"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        closeMobileMenu();
                      }}
                      className="bg-matte-gold text-rich-black hover:bg-yellow-500 font-medium py-3 px-6 w-full"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)} 
      />
      {isSearchModalOpen && (
        <SearchModal onClose={() => setIsSearchModalOpen(false)} />
      )}
    </Fragment>
  );
}