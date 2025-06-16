import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rich-black via-deep-charcoal to-rich-black"></div>
      <div 
        className="absolute inset-0 opacity-30" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-playfair text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Premium 
            <span className="text-matte-gold"> Fashion</span><br>
            Replicas
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover meticulously crafted luxury replicas that capture the essence of high-end fashion at accessible prices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/products">
              <Button size="lg" className="bg-matte-gold text-rich-black hover:bg-yellow-500 neo-shadow hover-lift px-8 py-4 text-lg">
                Shop Collection
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="lg" 
              className="glass-effect hover:bg-white/20 px-8 py-4 text-lg"
            >
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* 3D Product Showcase Placeholder */}
        <motion.div 
          className="mt-16 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="glass-effect rounded-3xl p-8 max-w-md mx-auto animate-float">
            <img 
              src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400" 
              alt="Featured luxury handbag" 
              className="w-full h-64 object-cover rounded-2xl mb-4" 
            />
            <p className="text-matte-gold font-semibold">Featured: Designer Handbag</p>
            <p className="text-gray-300">Interactive 3D Model</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
