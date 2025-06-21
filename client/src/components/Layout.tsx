import { ReactNode } from "react";
import Navigation from "./Navigation";
import CartModal from "./CartModal";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-rich-black text-cream-white font-sans antialiased">
      <Navigation />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <CartModal />
    </div>
  );
}
