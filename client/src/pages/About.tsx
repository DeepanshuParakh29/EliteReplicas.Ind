import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal text-gray-200 py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="font-playfair text-5xl font-bold text-center text-matte-gold mb-12">
          About Us
        </h1>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-100 mb-6">Our Story</h2>
          <p className="text-lg leading-relaxed mb-4">
            Welcome to Elite Replicas, your premier destination for high-quality replica luxury goods. 
            Founded with a passion for exquisite craftsmanship and accessible luxury, we believe that 
            everyone deserves to experience the allure of high-end fashion without the prohibitive price tag.
          </p>
          <p className="text-lg leading-relaxed">
            Our journey began with a simple idea: to bridge the gap between aspirational luxury and affordability. 
            We meticulously source materials and work with skilled artisans who share our commitment to detail, 
            ensuring that each replica mirrors the original in every aspect, from stitching to hardware.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-100 mb-6">Our Mission</h2>
          <p className="text-lg leading-relaxed mb-4">
            At Elite Replicas, our mission is to provide discerning customers with an unparalleled selection 
            of replica luxury items that meet the highest standards of quality and authenticity. We are 
            dedicated to offering products that not only look and feel like the real thing but also stand 
            the test of time.
          </p>
          <p className="text-lg leading-relaxed">
            We strive for transparency, integrity, and customer satisfaction. Every item in our collection 
            is carefully inspected to ensure it meets our rigorous quality control benchmarks, giving you 
            peace of mind with every purchase.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-100 mb-6">Why Choose Us?</h2>
          <ul className="list-disc list-inside space-y-3 text-lg leading-relaxed">
            <li>
              <strong className="text-matte-gold">Uncompromising Quality:</strong> We use premium materials and employ advanced techniques to create replicas that are virtually indistinguishable from their authentic counterparts.
            </li>
            <li>
              <strong className="text-matte-gold">Attention to Detail:</strong> From the precise stitching to the exact weight and feel, every detail is replicated with utmost care.
            </li>
            <li>
              <strong className="text-matte-gold">Affordable Luxury:</strong> Experience the prestige of luxury brands without the exorbitant cost.
            </li>
            <li>
              <strong className="text-matte-gold">Customer Satisfaction:</strong> Your happiness is our priority. We offer dedicated support and a seamless shopping experience.
            </li>
          </ul>
        </section>

        <section className="text-center">
          <p className="text-xl font-semibold text-gray-100 mb-4">
            Join the Elite Replicas family and elevate your style today.
          </p>
          <p className="text-lg leading-relaxed">
            For any inquiries, feel free to <a href="/contact" className="text-matte-gold hover:underline">contact us</a>.
          </p>
        </section>
      </div>
    </motion.div>
  );
}