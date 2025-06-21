import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal text-gray-200 py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-5xl font-bold text-center text-matte-gold mb-12">
          Contact Us
        </h1>

        <section className="mb-12 text-center">
          <p className="text-lg leading-relaxed mb-4">
            Have a question, comment, or need assistance? We're here to help!
            Reach out to us through any of the methods below, and we'll get back to you as soon as possible.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-deep-charcoal p-8 rounded-lg shadow-lg flex flex-col items-center text-center glass-effect">
            <Mail className="w-12 h-12 text-matte-gold mb-4" />
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">Email Us</h2>
            <p className="text-lg">elitereplicas.in@gmail.com</p>
          </div>

          <div className="bg-deep-charcoal p-8 rounded-lg shadow-lg flex flex-col items-center text-center glass-effect">
            <Phone className="w-12 h-12 text-matte-gold mb-4" />
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">Call Us</h2>
            <p className="text-lg">+1 (555) 123-4567</p>
          </div>

          <div className="bg-deep-charcoal p-8 rounded-lg shadow-lg flex flex-col items-center text-center glass-effect">
            <MapPin className="w-12 h-12 text-matte-gold mb-4" />
            <h2 className="text-2xl font-semibold text-gray-100 mb-2">Visit Us</h2>
            <p className="text-lg">Usha Estates</p>
            <p className="text-lg">Raipur Chhatishgarh</p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-100 mb-6 text-center">Send Us a Message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-300 mb-2">Your Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                className="w-full p-3 rounded-md bg-rich-black border border-matte-gold/30 focus:border-matte-gold focus:ring focus:ring-matte-gold focus:ring-opacity-50 outline-none transition duration-200"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-300 mb-2">Your Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="w-full p-3 rounded-md bg-rich-black border border-matte-gold/30 focus:border-matte-gold focus:ring focus:ring-matte-gold focus:ring-opacity-50 outline-none transition duration-200"
                placeholder="john.doe@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-medium text-gray-300 mb-2">Your Message</label>
              <textarea 
                id="message" 
                name="message" 
                rows={5} 
                className="w-full p-3 rounded-md bg-rich-black border border-matte-gold/30 focus:border-matte-gold focus:ring focus:ring-matte-gold focus:ring-opacity-50 outline-none transition duration-200"
                placeholder="Type your message here..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="w-full bg-matte-gold text-rich-black py-3 rounded-md font-semibold text-lg hover:bg-yellow-500 transition duration-300 shadow-lg"
            >
              Send Message
            </button>
          </form>
        </section>
      </div>
    </motion.div>
  );
}