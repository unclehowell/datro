import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, X, ShieldCheck, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_your_stripe_publishable_key');

interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

const packages: Package[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    credits: 100,
    features: ['100 credits', 'Email support', '1 user'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    credits: 500,
    features: ['500 credits', 'Priority support', '5 users', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    credits: 2000,
    features: ['2000 credits', '24/7 support', 'Unlimited users', 'API access', 'Custom integration'],
  },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  onNavigate: (page: any) => void;
  initialTab?: 'signin' | 'signup';
}

type Step = 'packages' | 'register' | 'payment';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onNavigate, initialTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [step, setStep] = useState<Step>('packages');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setStep('register');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const action = activeTab === 'signin' ? 'login' : 'register';
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('auth_token', data.token);
      
      if (action === 'register' && selectedPackage) {
        setStep('payment');
      } else {
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'register') {
      setStep('packages');
    } else if (step === 'payment') {
      setStep('register');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-0 right-0 bottom-0 z-[1000] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-4xl bg-paper border border-border p-10 space-y-8 shadow-2xl relative my-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
            >
              <X size={24} />
            </button>

            {step === 'packages' && (
              <PackageSelection onSelect={handlePackageSelect} />
            )}

            {step === 'register' && (
              <RegisterForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isLoading={isLoading}
                error={error}
                selectedPackage={selectedPackage}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            )}

            {step === 'payment' && selectedPackage && (
              <PaymentForm
                package={selectedPackage}
                email={email}
                onSuccess={() => {
                  onAuthSuccess({ email, package: selectedPackage });
                }}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PackageSelection({ onSelect }: { onSelect: (pkg: Package) => void }) {
  return (
    <>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center rounded-full">
          <ShieldCheck size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Select a Package</h2>
          <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">Choose your plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() => onSelect(pkg)}
            className="border border-border p-6 space-y-4 cursor-pointer hover:border-accent transition-all"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-ink">{pkg.name}</h3>
              <p className="text-3xl font-bold text-ink">
                ${pkg.price}<span className="text-sm font-normal text-ink/40">/mo</span>
              </p>
            </div>
            <ul className="space-y-2">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-ink/70">
                  <Check size={14} className="text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            <button className="w-full bg-ink text-paper py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-all">
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function RegisterForm({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  error,
  selectedPackage,
  onSubmit,
  onBack,
}: any) {
  return (
    <>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Create Account</h2>
          <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
            {selectedPackage?.name} - ${selectedPackage?.price}/mo
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card border border-border px-4 py-3 focus:outline-none focus:border-accent transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink/30">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border px-4 py-3 focus:outline-none focus:border-accent transition-all font-medium"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-card border border-border py-3 text-[10px] font-bold uppercase tracking-widest hover:border-accent transition-all"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-ink text-paper py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-all disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </>
  );
}

function PaymentForm({ package: pkg, email, onSuccess, onBack }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message || 'Payment failed');
      setIsProcessing(false);
      return;
    }

    // TODO: Send paymentMethod.id to your backend to complete payment
    // For now, simulate success
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <Elements stripe={stripePromise} options={{}}>
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Payment</h2>
            <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest">
              {pkg.name} - ${pkg.price}/mo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-card border border-border">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#333',
                  },
                },
              }}
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-card border border-border py-3 text-[10px] font-bold uppercase tracking-widest hover:border-accent transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isProcessing || !stripe}
              className="flex-1 bg-ink text-paper py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Pay $${pkg.price}`}
            </button>
          </div>
        </form>
      </div>
    </Elements>
  );
}
