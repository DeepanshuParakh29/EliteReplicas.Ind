import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, Menu, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navigation() {
  const [location] = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { itemCount, setIsOpen: setCartOpen } = useCart();

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-matte-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-matte-gold to-yellow-600 rounded-full flex items-center justify-center neo-shadow">
                <Crown className="text-rich-black w-6 h-6" />
              </div>
              <h1 className="font-playfair text-2xl font-bold text-matte-gold">EliteReplicas</h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`hover:text-matte-gold transition-colors duration-300 ${location === "/" ? "text-matte-gold" : ""}`}>
                Home
              </Link>
              <Link href="/products" className={`hover:text-matte-gold transition-colors duration-300 ${location === "/products" ? "text-matte-gold" : ""}`}>
                Products
              </Link>
              <Link href="/about" className={`hover:text-matte-gold transition-colors duration-300 ${location === "/about" ? "text-matte-gold" : ""}`}>
                About
              </Link>
              <Link href="/contact" className={`hover:text-matte-gold transition-colors duration-300 ${location === "/contact" ? "text-matte-gold" : ""}`}>
                Contact
              </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchModalOpen(true)}
                className="hover:text-matte-gold"
              >
                <Search className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative hover:text-matte-gold"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-matte-gold text-rich-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {itemCount}
                  </span>
                )}
              </Button>

              {user ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <Button variant="ghost" className="hover:text-matte-gold">
                      {user.name}
                    </Button>
                  </Link>
                  {(user.role === "admin" || user.role === "super_admin") && (
                    <Link href="/admin">
                      <Button variant="ghost" className="hover:text-matte-gold">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className="hover:text-matte-gold"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-matte-gold text-rich-black hover:bg-yellow-500 neo-shadow"
                >
                  Sign In
                </Button>
              )}
              
              {/* Mobile Menu Button */}
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      {isSearchModalOpen && <SearchModal onClose={() => setIsSearchModalOpen(false)} />}
    </>
  );
}
