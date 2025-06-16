import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import { motion } from "framer-motion";
import { Gem, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedProducts />
      
      {/* Why Choose Us Section */}
      <section className="py-20 bg-deep-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
              Why <span className="text-matte-gold">EliteReplicas</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience luxury fashion without compromise
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Gem,
                title: "Premium Quality",
                description: "Meticulously crafted replicas using the finest materials and attention to detail"
              },
              {
                icon: Shield,
                title: "Secure Shopping",
                description: "Protected transactions and encrypted data for peace of mind"
              },
              {
                icon: Truck,
                title: "Fast Delivery",
                description: "Express shipping worldwide with tracking and insurance"
              }
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="text-center p-8 glass-effect rounded-2xl hover-lift"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <div className="w-16 h-16 bg-matte-gold rounded-full flex items-center justify-center mx-auto mb-6 neo-shadow">
                  <feature.icon className="text-rich-black w-8 h-8" />
                </div>
                <h3 className="font-playfair text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-matte-gold to-yellow-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-rich-black mb-6">
              Stay in Style
            </h2>
            <p className="text-xl text-rich-black/80 mb-8">
              Subscribe for exclusive offers and new arrivals
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="flex rounded-full overflow-hidden neo-shadow">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-6 py-4 text-rich-black bg-white border-0 focus:ring-0 rounded-none" 
                />
                <Button className="bg-rich-black text-matte-gold px-8 py-4 hover:bg-deep-charcoal rounded-none">
                  Subscribe
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rich-black border-t border-matte-gold/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-matte-gold rounded-full flex items-center justify-center">
                  <Gem className="text-rich-black w-5 h-5" />
                </div>
                <h3 className="font-playfair text-xl font-bold text-matte-gold">EliteReplicas</h3>
              </div>
              <p className="text-gray-400 mb-6">Premium fashion replicas crafted with precision and care.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-matte-gold transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">Products</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">About</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-matte-gold transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-matte-gold transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-matte-gold transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-matte-gold/20 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 EliteReplicas.in. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
