import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle, Eraser } from 'lucide-react';
import { generateSessionId, getClientIp } from '../lib/utils';
import kountSDK from '@kount/kount-web-client-sdk';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';

const STEPS = [
  { id: 'personal', title: 'Personal Details' },
  { id: 'address', title: 'Address' },
  { id: 'signature', title: 'Sign' },
  { id: 'review', title: 'Review' }
];

export const ClaimForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [kountReady, setKountReady] = useState(false);
  
  const [formData, setFormData] = useState({
    title: 'Mr',
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
  const [signatureImage, setSignatureImage] = useState<string>('');
  const signatureRef = useRef<SignatureCanvas>(null);
  const formStartFired = useRef(false);

  console.log("--- BROWSER: RENDERING STEP ---", currentStep);
  console.log("--- BROWSER: SUBMITTING STATE ---", isSubmitting);
  console.log("--- BROWSER: ERROR STATE ---", error);
  console.log("--- BROWSER: SESSION ID STATE ---", sessionId);
  console.log("--- BROWSER: FORM DATA STATE ---", formData);
  console.log("--- BROWSER: STEPS ---", STEPS);

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
      clientID: import.meta.env.VITE_KOUNT_CLIENT_ID || '341408861572516',
      environment: 'PROD', // or 'TEST' while testing
      isSinglePageApp: true,
      callbacks: {
        'collect-begin': (params: any) => console.log('Kount started', params),
        'collect-end': (params: any) => {
          console.log('Kount fingerprint complete', params);
          setKountReady(true);
        },
      },
    };
    console.log("--- BROWSER: KOUNT CONFIG ---", kountConfig);
    
    try {
      kountSDK(kountConfig, sid);
    } catch (e) {
      console.error('Kount initialization failed', e);
      setTimeout(() => setKountReady(true), 5000);
    }
  }, []);

  const handleFocus = () => {
    if (!formStartFired.current && window.gtag) {
      gtag('event', 'form_start', { 'form_name': 'claim_form' });
      formStartFired.current = true;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    if (e.target.name === 'date_of_birth') {
      // Simple mask for DD/MM/YYYY
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 2) {
        value = digits;
      } else if (digits.length <= 4) {
        value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        value = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      }
    }

    console.log(`--- BROWSER: INPUT CHANGE [${e.target.name}] ---`, value);
    setFormData({ ...formData, [e.target.name]: value });
  };

  const nextStep = () => {
    if (currentStep === 0) {
      // Basic validation for DOB format
      const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dobRegex.test(formData.date_of_birth)) {
        alert('Please enter a valid Date of Birth in DD/MM/YYYY format');
        return;
      }
    }
    // CRITICAL: Capture signature BEFORE leaving step 2 (canvas gets unmounted!)
    if (currentStep === 2) {
      const captured = captureSignatureOnStepChange();
      if (!captured) {
        alert('Please sign before continuing');
        return;
      }
    }
    
    console.log("--- BROWSER: NEXT STEP ---", currentStep + 1);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => {
    console.log("--- BROWSER: PREV STEP ---", currentStep - 1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // FLYWHEEL #5: Capture signature when leaving step 2 BEFORE canvas unmounts
  const captureSignatureOnStepChange = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      try {
        const sigData = signatureRef.current.toDataURL('image/png');
        if (sigData && sigData.length > 50) {
          console.log("--- BROWSER: Captured signature on step change, length:", sigData.length);
          setSignatureImage(sigData);
          return true;
        }
      } catch (e) {
        console.error("--- BROWSER: Failed to capture signature:", e);
      }
    }
    return false;
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureImage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!kountReady) {
      alert('Please wait for device verification to complete');
      return;
    }

    // FLYWHEEL #5: Use pre-captured signature if available
    // This is critical because canvas gets unmounted when leaving step 2
    let sigData = signatureImage;
    console.log("--- BROWSER: Stored signature length:", sigData.length);
    
    // Fallback: try to capture if no stored signature
    if (!sigData || sigData.length < 50) {
      if (signatureRef.current?.isEmpty()) {
        alert('Please sign before submitting');
        return;
      }
      // FLYWHEEL #4: Robust signature capture with canvas initialization
      // Key insight: canvas may need explicit dimensions or onLoad handling
      try {
        const sigCanvas = signatureRef.current;
        if (!sigCanvas || sigCanvas.isEmpty()) {
          console.log("--- BROWSER: No signature strokes detected");
        } else {
          console.log("--- BROWSER: Signature strokes detected, attempting capture");
          
          // Force canvas to have proper dimensions - some browsers need this
          const canvasEl = sigCanvas.getCanvas();
          if (canvasEl) {
            // Ensure canvas has proper dimensions
            if (!canvasEl.width || canvasEl.width === 0) {
              canvasEl.width = 600;
            }
            if (!canvasEl.height || canvasEl.height === 0) {
              canvasEl.height = 192;
            }
            console.log("--- BROWSER: Canvas dimensions:", canvasEl.width, "x", canvasEl.height);
          }
          
          // Method 1: Direct toDataURL with explicit dimensions
          let dataUrl = '';
          try {
            dataUrl = sigCanvas.toDataURL('image/png');
          } catch (e) {
            console.log("--- BROWSER: toDataURL() failed:", e);
          }
          
          // Method 2: Try getTrimmedCanvas
          if (!dataUrl || dataUrl.length < 50) {
            try {
              const trimmed = sigCanvas.getTrimmedCanvas();
              if (trimmed && trimmed.width > 0 && trimmed.height > 0) {
                dataUrl = trimmed.toDataURL('image/png');
                console.log("--- BROWSER: getTrimmedCanvas worked, length:", dataUrl.length);
              }
            } catch (e) {
              console.log("--- BROWSER: getTrimmedCanvas() failed:", e);
            }
          }
          
          // Use the data URL if valid
          if (dataUrl && dataUrl.length > 50 && dataUrl.startsWith('data:image')) {
            sigData = dataUrl;
            console.log("--- BROWSER: SUCCESS - signature captured, length:", sigData.length);
          } else {
            console.log("--- BROWSER: All methods failed - empty or invalid dataURL");
            console.log("--- BROWSER: dataUrl value:", dataUrl ? dataUrl.substring(0, 50) : "empty");
          }
        }
      } catch (err) {
        console.error("--- BROWSER: Signature capture exception:", err);
      }
    } // end of fallback if block

    setSignatureImage(sigData);
    
    console.log("--- BROWSER: FINAL SIGNATURE ---");
    console.log("Signature length:", sigData.length);
    console.log("Signature starts with:", sigData.substring(0, 50));
    
    // Validate signature was captured
    if (!sigData || sigData.length < 50) {
      alert('Signature capture failed. Please try again or refresh the page.');
      return;
    }

    console.log("--- BROWSER: SUBMITTING FORM ---", formData);
    setIsSubmitting(true);
    setError(null);

    // GA4: form submit event (built-in)
    if (window.gtag) {
      gtag('event', 'form_submit', { 'form_name': 'claim_form' });
    }

    try {
      const userAgent = navigator.userAgent;
      console.log("User Agent:", userAgent);
      console.log("--- BROWSER: ENV CHECK ---");
      console.log("Kount Client ID present:", !!import.meta.env.VITE_KOUNT_CLIENT_ID);
      
      console.log("Session ID:", sessionId);
      
      const dobFormatted = formData.date_of_birth 
        ? formData.date_of_birth.split('/').reverse().join('-')
        : '';

      const signatureData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: dobFormatted,
        phone: formData.phone,
        email: formData.email,
        addresses: [
          {
            buildingNumber: formData.buildingNumber || '',
            thoroughfare: formData.thoroughfare || '',
            townOrCity: formData.townOrCity || '',
            postcode: formData.postcode || ''
          }
        ]
      };

      const signature = btoa(JSON.stringify(signatureData));
      
      // Use FormData as requested by user
      const submissionData = new FormData();
      submissionData.append('title', formData.title);
      submissionData.append('first_name', formData.first_name);
      submissionData.append('last_name', formData.last_name);
      submissionData.append('date_of_birth', dobFormatted);
      submissionData.append('phone', formData.phone);
      submissionData.append('email', formData.email);
      submissionData.append('buildingNumber', formData.buildingNumber);
      submissionData.append('thoroughfare', formData.thoroughfare);
      submissionData.append('townOrCity', formData.townOrCity);
      submissionData.append('postcode', formData.postcode);
      submissionData.append('signature', signature);
      submissionData.append('user_agent', navigator.userAgent);
      submissionData.append('session_id', sessionId);
      submissionData.append('device_session_id', sessionId); // REQUIRED by ViewThru
      submissionData.append('signature_image', sigData);
      
      console.log("--- BROWSER: SENDING PAYLOAD (FormData) ---");
      console.log("URL:", `/api/submit-claim`);
      
      const response = await fetch(`/api/submit-claim`, {
        method: 'POST',
        body: submissionData
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

      // Catch ViewThru validation errors that return HTTP 200
      const body = result.body || result;
      if (
        body.message === "Validation failed." ||
        body.error ||
        (body.errors && Object.keys(body.errors).length > 0) ||
        body.success === false ||
        body.status === 'error'
      ) {
        const errorMsg = body.message ||
          (body.errors ? JSON.stringify(body.errors) : 'Submission rejected by server');
        throw new Error(errorMsg);
      }

      if (body.status === 'authentication-required') {
        console.log('--- BROWSER: AUTH REQUIRED, REDIRECTING ---');
        window.location.href = body.url;
      } else {
        console.log('--- BROWSER: SUCCESS, NAVIGATING TO THANK YOU ---');
        // GA4: generate_lead event on success
        if (window.gtag) {
          gtag('event', 'generate_lead', { 'form_name': 'claim_form' });
        }
        navigate('/thank-you');
      }
    } catch (err: any) {
      console.error("--- BROWSER: SUBMISSION ERROR ---", err);
      setError(err.message);
      // GA4: exception event on error
      if (window.gtag) {
        gtag('event', 'exception', { 'description': err.message, 'fatal': false });
      }
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

      <form onSubmit={handleSubmit} onFocus={handleFocus} className="space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label htmlFor="title" className="text-xs font-black uppercase tracking-wider text-brand-primary">Title</label>
                <select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors bg-white"
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="first_name" className="text-xs font-black uppercase tracking-wider text-brand-primary">First Name</label>
                  <input
                    required
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="last_name" className="text-xs font-black uppercase tracking-wider text-brand-primary">Last Name</label>
                  <input
                    required
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="date_of_birth" className="text-xs font-black uppercase tracking-wider text-brand-primary">Date of Birth (DD/MM/YYYY)</label>
                <input
                  required
                  id="date_of_birth"
                  type="text"
                  name="date_of_birth"
                  placeholder="DD/MM/YYYY"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-brand-primary">Phone Number</label>
                <input
                  required
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-brand-primary">Email Address</label>
                <input
                  required
                  id="email"
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
                <label htmlFor="buildingNumber" className="text-xs font-black uppercase tracking-wider text-brand-primary">Building Number / Name</label>
                <input
                  id="buildingNumber"
                  name="buildingNumber"
                  value={formData.buildingNumber}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="thoroughfare" className="text-xs font-black uppercase tracking-wider text-brand-primary">Street Name</label>
                <input
                  required
                  id="thoroughfare"
                  name="thoroughfare"
                  value={formData.thoroughfare}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="townOrCity" className="text-xs font-black uppercase tracking-wider text-brand-primary">City / Town</label>
                <input
                  required
                  id="townOrCity"
                  name="townOrCity"
                  value={formData.townOrCity}
                  onChange={handleChange}
                  className="w-full p-4 border-4 border-brand-primary focus:bg-brand-accent outline-none font-bold uppercase transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="postcode" className="text-xs font-black uppercase tracking-wider text-brand-primary">Postcode</label>
                <input
                  required
                  id="postcode"
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
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-brand-primary">
                  Your Signature
                </label>
                <div className="border-4 border-brand-primary bg-white touch-none">
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="#000000"
                    canvasProps={{
                      className: 'w-full h-48 bg-white',
                      style: { touchAction: 'none' },
                      width: 600,
                      height: 192
                    }}
                    backgroundColor="white"
                    dotSize={1}
                    minDistance={2}
                    throttle={16}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-primary hover:text-brand-secondary transition-colors mt-2"
                >
                  <Eraser className="w-3 h-3" /> Clear Signature
                </button>
              </div>
              <p className="text-[10px] font-bold uppercase text-brand-primary leading-tight">
                Please sign in the box above to confirm your agreement.
              </p>
            </motion.div>
          )}

          {currentStep === 3 && (
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
              disabled={isSubmitting || !kountReady}
              className="brutal-btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : !kountReady ? (
                <>Verifying device...</>
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
