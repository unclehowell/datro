import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { generateSessionId, getClientIp } from '../lib/utils';
import kountSDK from '@kount/kount-web-client-sdk';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 'personal', title: 'Personal Details' },
  { id: 'address', title: 'Address' },
  { id: 'review', title: 'Review' }
];

export const ClaimForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  
  console.log("--- BROWSER: RENDERING STEP ---", currentStep);
  console.log("--- BROWSER: SUBMITTING STATE ---", isSubmitting);
  console.log("--- BROWSER: ERROR STATE ---", error);
  console.log("--- BROWSER: SESSION ID STATE ---", sessionId);
  console.log("--- BROWSER: FORM DATA STATE ---", formData);
  console.log("--- BROWSER: STEPS ---", STEPS);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    email: '',
    buildingNumber: '',
    thoroughfare: '',
    townOrCity: '',
    postcode: ''
  });

  useEffect(() => {
    console.log("--- BROWSER: FORM MOUNTED ---");
    // Initialize Kount Session
    let sid = sessionStorage.getItem('kount_session_id');
    if (!sid) {
      sid = generateSessionId();
      sessionStorage.setItem('kount_session_id', sid);
    }
    console.log("--- BROWSER: SESSION ID INITIALIZED ---", sid);
    setSessionId(sid);

    const kountConfig = {
      clientID: import.meta.env.VITE_KOUNT_CLIENT_ID || '341408861572516', // Updated with user provided KountID
      environment: 'TEST',
      isSinglePageApp: true,
      callbacks: {
        'collect-begin': () => console.log('Kount collection started'),
        'collect-end': () => console.log('Kount collection completed')
      }
    };
    console.log("--- BROWSER: KOUNT CONFIG ---", kountConfig);
    
    try {
      kountSDK(kountConfig, sid);
    } catch (e) {
      console.error('Kount initialization failed', e);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`--- BROWSER: INPUT CHANGE [${e.target.name}] ---`, e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    console.log("--- BROWSER: NEXT STEP ---", currentStep + 1);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => {
    console.log("--- BROWSER: PREV STEP ---", currentStep - 1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("--- BROWSER: SUBMITTING FORM ---", formData);
    setIsSubmitting(true);
    setError(null);

    try {
      let clientIp = '0.0.0.0';
      try {
        clientIp = await getClientIp();
        console.log("Client IP:", clientIp);
      } catch (e) {
        console.error("--- BROWSER: IP FETCH ERROR ---", e);
      }
      const userAgent = navigator.userAgent;
      console.log("User Agent:", userAgent);
      const affiliateId = import.meta.env.VITE_AFFILIATE_ID || 'default';
      const apiKey = import.meta.env.VITE_API_KEY || 'demo-key';
      
      console.log("--- BROWSER: ENV CHECK ---");
      console.log("Affiliate ID present:", !!import.meta.env.VITE_AFFILIATE_ID);
      console.log("API Key present:", !!import.meta.env.VITE_API_KEY);
      
      console.log("Session ID:", sessionId);
      
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        phone: formData.phone,
        email: formData.email,
        client_ip: clientIp,
        user_agent: userAgent,
        session_id: sessionId,
        addresses: [{
          buildingNumber: formData.buildingNumber,
          thoroughfare: formData.thoroughfare,
          townOrCity: formData.townOrCity,
          postcode: formData.postcode
        }]
      };
      
      console.log("--- BROWSER: SENDING PAYLOAD (addresses as array) ---", payload);
      console.log("URL:", `/api/submit-claim`);
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      console.log("Headers:", headers);
      
      const response = await fetch(`/api/submit-claim`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      console.log("--- BROWSER: RESPONSE RECEIVED ---");
      console.log("Status:", response.status);
      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      let result;
      if (contentType && contentType.includes("application/json")) {
        const resText = await response.text();
        console.log("--- BROWSER: RAW RESPONSE ---", resText);
        try {
          result = JSON.parse(resText);
          console.log("--- BROWSER: RESULT ---", result);
        } catch (e: any) {
          console.error("--- BROWSER: PARSE ERROR ---", e);
          throw new Error(`Failed to parse server response: ${e.message}`);
        }
      } else {
        const text = await response.text();
        console.log("--- BROWSER: NON-JSON RESPONSE ---", text);
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}`);
      }

      if (response.ok) {
        // Check for logical errors in 200 OK response
        if (result.success === false || result.status === 'error') {
          throw new Error(result.message || 'The API returned an error. Please check your data.');
        }

        if (result.status === 'authentication-required') {
          console.log('--- BROWSER: AUTH REQUIRED, REDIRECTING ---');
          window.location.href = result.url;
        } else {
          console.log('--- BROWSER: SUCCESS, NAVIGATING TO THANK YOU ---');
          navigate('/thank-you');
        }
      } else {
        throw new Error(result.message || `Submission failed (Status: ${response.status}). Please try again.`);
      }
    } catch (err: any) {
      console.error("--- BROWSER: SUBMISSION ERROR ---", err);
      setError(err.message);
      console.log("--- BROWSER: RESETTING SUBMITTING STATE ---");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 border-4 border-brand-primary shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      {/* Progress Indicator */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-brand-primary -translate-y-1/2 z-0" />
        {STEPS.map((step, index) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-12 h-12 flex items-center justify-center border-4 transition-all transform ${
                index <= currentStep 
                  ? 'bg-brand-accent border-brand-primary text-brand-primary scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white border-brand-primary text-gray-400'
              }`}
            >
              <span className="font-display font-bold text-xl italic">
                {index < currentStep ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
              </span>
            </div>
            <span className={`text-[10px] uppercase tracking-widest mt-3 font-black ${index <= currentStep ? 'text-brand-primary' : 'text-gray-400'}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-primary">First Name</label>
                  <input
                    required
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Last Name</label>
                  <input
                    required
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Date of Birth</label>
                <input
                  required
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Phone Number</label>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Building Number / Name</label>
                <input
                  required
                  name="buildingNumber"
                  value={formData.buildingNumber}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Street Name</label>
                <input
                  required
                  name="thoroughfare"
                  value={formData.thoroughfare}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">City / Town</label>
                <input
                  required
                  name="townOrCity"
                  value={formData.townOrCity}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">Postcode</label>
                <input
                  required
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-brand-accent/20 p-6 space-y-4 border-4 border-brand-primary">
                <h3 className="font-display font-bold text-2xl uppercase italic border-b-4 border-brand-primary pb-2">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold uppercase">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Name:</span>
                    <span className="text-lg leading-none">{formData.first_name} {formData.last_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">DOB:</span>
                    <span className="text-lg leading-none">{formData.date_of_birth}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Contact:</span>
                    <span className="text-lg leading-none">{formData.email} <br /> {formData.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Address:</span>
                    <span className="text-lg leading-none">
                      {formData.buildingNumber} {formData.thoroughfare}, {formData.townOrCity}, {formData.postcode}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-brand-primary leading-tight">
                BY SUBMITTING THIS FORM, YOU AGREE TO OUR TERMS AND CONDITIONS AND AUTHORIZE JIGSAW CLAIMS LTD TO PROCESS YOUR ENQUIRY.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex flex-col gap-2 p-4 bg-brand-secondary text-brand-primary font-bold uppercase text-sm border-4 border-brand-primary">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
            <div className="mt-2 text-[10px] border-t border-brand-primary pt-2">
              <p>Debug: <a href="/api/ping" target="_blank" className="underline">Test Functions Status</a></p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-8 border-t-4 border-brand-primary">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 text-brand-primary hover:text-brand-secondary transition-colors font-black uppercase tracking-widest text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="brutal-btn flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="brutal-btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>Check Eligibility <CheckCircle2 className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
