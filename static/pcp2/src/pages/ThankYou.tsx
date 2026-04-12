import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThankYou: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full text-center space-y-12"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-serif">Thank You</h1>
          <p className="text-2xl text-gray-600 font-light">Your eligibility check has been received.</p>
        </div>

        <div className="bg-gray-50 p-8 border border-gray-100 text-left space-y-6">
          <h3 className="font-serif text-xl border-b border-gray-200 pb-2">What Happens Next?</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <p className="text-sm text-gray-600">Our specialist team will review your details against our database of mis-sold agreements.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <p className="text-sm text-gray-600">We will contact you via phone or email within 24-48 hours to discuss the next steps.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <p className="text-sm text-gray-600">If eligible, we'll handle the entire legal process to recover your compensation.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2 justify-center">
            <Mail className="w-4 h-4 text-brand-accent" /> info@jigsawclaims.co.uk
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Phone className="w-4 h-4 text-brand-accent" /> 0161 XXX XXXX
          </div>
        </div>

        <Link to="/" className="inline-flex items-center gap-2 text-brand-accent font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all">
          Return to Homepage <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
};
