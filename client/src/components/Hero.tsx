import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-rich-black opacity-70"></div>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/hero-bg.jpg')` }}></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-cream-white p-4 glass-effect rounded-xl border border-matte-gold/30">
        <div>
          <h1 className="text-6xl md:text-7xl font-playfair font-bold mb-6 text-matte-gold drop-shadow-lg">EliteReplicas</h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl">Discover the finest replica watches, meticulously crafted to perfection.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button size="lg" className="bg-matte-gold text-rich-black hover:bg-matte-gold/90 transition-all duration-300 shadow-lg hover:shadow-xl text-lg px-8 py-3 rounded-full">Explore Collections</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
