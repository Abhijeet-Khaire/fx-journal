import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { Plan } from "@/lib/tradeTypes";
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Bitcoin, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  DollarSign,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { id: "stripe", name: "Stripe", icon: CreditCard, description: "Pay with any major credit card" },
  { id: "razorpay", name: "Razorpay", icon: Wallet, description: "Cards, Netbanking, Wallets" },
  { id: "upi", name: "UPI", icon: Smartphone, description: "Google Pay, PhonePe, Paytm" },
  { id: "crypto", name: "Cryptocurrency", icon: Bitcoin, description: "Pay with BTC, ETH, USDT" },
  { id: "card", name: "Debit / Credit Card", icon: CreditCard, description: "Secure direct card entry" },
];

const PLAN_DETAILS: Record<string, { name: string, price: string, amount: number }> = {
  pro: { name: "Professional", price: "$12/mo", amount: 12 },
  ultimate: { name: "Institutional", price: "$39/mo", amount: 39 },
};

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { plan: currentPlan, upgradePlan } = usePlan();
  
  const planId = searchParams.get("plan") as Plan | null;
  const planDetails = planId && PLAN_DETAILS[planId] ? PLAN_DETAILS[planId] : null;

  const [selectedMethod, setSelectedMethod] = useState<string>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    // If no plan is specified or user is already on this plan, redirect back to plans
    if (!planId || !planDetails || currentPlan === planId) {
      navigate("/plans");
    }
  }, [planId, currentPlan, planDetails, navigate]);

  const handlePayment = async () => {
    if (selectedMethod === "card") {
      if (!cardNumber || !expiry || !cvv) {
        toast.error("Please fill in all card details.");
        return;
      }
    }

    setIsProcessing(true);
    // Simulate secure payment processing latency
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setIsProcessing(false);
    setSuccess(true);
    upgradePlan(planId!);
    toast.success(`Successfully upgraded to ${planDetails?.name} plan!`);

    // Redirect after success animation
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  if (!planId || !planDetails) return null;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
          Secure <span className="text-primary not-">Checkout</span>
        </h1>
        <p className="text-muted-foreground font-medium mt-2">
          Complete your upgrade to the <span className="text-white font-bold">{planDetails.name}</span> account tier.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Left Column - Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6 md:p-8 relative">
            <h2 className="text-xs uppercase font-black tracking-widest text-muted-foreground mb-6">Select Payment Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 text-left w-full",
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl transition-colors",
                      isSelected ? "bg-primary text-black" : "bg-white/10 text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-bold text-sm",
                        isSelected ? "text-primary" : "text-white"
                      )}>
                        {method.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {method.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Dynamic Payment Input Section based on selection */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMethod}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 overflow-hidden"
              >
                {selectedMethod === "card" && (
                  <div className="space-y-4 p-6 bg-black/40 border border-white/5 rounded-2xl">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Card Number</label>
                      <input 
                        type="text" 
                        className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium font-mono"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Expiry</label>
                        <input 
                          type="text" 
                          className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium font-mono"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">CVV</label>
                        <input 
                          type="password" 
                          className="glass-input w-full px-4 py-3 text-sm rounded-xl font-medium font-mono"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === "crypto" && (
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-white/10 rounded-2xl mb-4">
                      {/* Fake QR Code */}
                      <div className="w-32 h-32 bg-white/20 grid grid-cols-4 grid-rows-4 gap-1 p-1 rounded-lg">
                         {[...Array(16)].map((_, i) => (
                           <div key={i} className={Math.random() > 0.5 ? "bg-white" : "bg-transparent"} />
                         ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-2">Deposit Address (USDT TRC20)</p>
                    <div className="bg-black/50 px-4 py-2 border border-white/10 rounded-lg text-primary font-mono text-xs w-full overflow-hidden text-ellipsis">
                      T9yD14Nj9j7xAB4dbGeiX9h8i1...
                    </div>
                  </div>
                )}

                {selectedMethod === "upi" && (
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-4">
                    <p className="text-sm font-medium text-white">Scan with any UPI App</p>
                    <div className="mx-auto w-32 h-32 bg-white/20 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                      <Smartphone className="w-10 h-10 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-xs text-muted-foreground">or pay to <span className="text-primary font-mono">zenith@upi</span></p>
                  </div>
                )}

                {(selectedMethod === "stripe" || selectedMethod === "razorpay") && (
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">You will be securely redirected</p>
                      <p className="text-xs text-muted-foreground">After clicking Pay Now, you'll complete your purchase on {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}'s secure checkout.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </GlassCard>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 sticky top-24">
            <h2 className="text-xs uppercase font-black tracking-widest text-muted-foreground mb-6">Order Summary</h2>
            
            <div className="flex items-center justify-between py-4 border-b border-white/10 mb-4">
              <div>
                <p className="text-white font-bold">{planDetails.name} Tier</p>
                <p className="text-xs text-muted-foreground mt-1">Billed monthly</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-white">{planDetails.price}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Subtotal</span>
              <span className="text-white">${planDetails.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 pb-6 border-b border-white/10">
              <span>Tax (0%)</span>
              <span className="text-white">$0.00</span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-white uppercase tracking-wider text-sm">Total Due</span>
              <span className="text-3xl font-black text-primary flex items-center">
                <DollarSign className="w-6 h-6 -mr-1" />
                {planDetails.amount.toFixed(2)}
              </span>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || success}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 relative overflow-hidden group/btn",
                success 
                  ? "bg-profit text-white hover:bg-profit" 
                  : "bg-primary text-black hover:bg-primary/90"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Securely...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Payment Successful
                  </>
                ) : (
                  <>
                    Pay Now <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>

            <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" />
              256-bit SSL Encrypted
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
