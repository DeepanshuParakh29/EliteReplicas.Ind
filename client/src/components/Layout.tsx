import { ReactNode } from "react";
import Navigation from "./Navigation";
import CartModal from "./CartModal";
import AuthModal from "./AuthModal";
import SearchModal from "./SearchModal";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-rich-black text-cream-white">
      <Navigation />
      <main className="pt-20">
        {children}
      </main>
      <CartModal />
      <AuthModal />
      <SearchModal />
    </div>
  );
}
