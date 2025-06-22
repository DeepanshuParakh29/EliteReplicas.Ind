import Head from 'next/head';
import { motion } from 'framer-motion';
import { AlertCircle, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal flex items-center justify-center p-4">
      <Head>
        <title>Maintenance Mode - Elite Replicas</title>
        <meta name="description" content="Elite Replicas is currently under maintenance. We'll be back soon!" />
      </Head>

      <motion.div 
        className="max-w-2xl w-full bg-rich-black/80 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/20 shadow-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
          <Wrench className="w-10 h-10 text-amber-400" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-4">
          Under Maintenance
        </h1>
        
        <div className="bg-amber-900/20 border-l-4 border-amber-500 text-amber-100 p-4 mb-8 rounded-r">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>We're performing scheduled maintenance. We'll be back online shortly.</p>
          </div>
        </div>
        
        <p className="text-gray-300 mb-8">
          We apologize for the inconvenience. Our team is working hard to improve your experience.
          Please check back later.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            asChild
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link href="/">
              Refresh Page
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          >
            <a href="mailto:support@elitereplicas.com">
              Contact Support
            </a>
          </Button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-amber-500/20">
          <p className="text-sm text-amber-500/70">
            Elite Replicas • {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
