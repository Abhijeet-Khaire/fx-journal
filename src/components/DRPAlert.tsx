import React, { useMemo } from "react";
import { Trade } from "@/lib/tradeTypes";
import { checkDrawdownRecoveryProtocol } from "@/lib/mlEngine";
import { AlertOctagon, ArrowUpRight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

interface DRPAlertProps {
  trades: Trade[];
}

export function DRPAlert({ trades }: DRPAlertProps) {
  const drp = useMemo(() => checkDrawdownRecoveryProtocol(trades), [trades]);

  if (!drp.isActive) return null;

  return (
    <div className="bg-loss/20 border border-loss text-loss-foreground rounded-xl p-4 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-loss/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-start md:items-center gap-4 relative z-10 flex-col md:flex-row">
        <div className="p-3 bg-loss/30 rounded-lg shrink-0">
          <AlertOctagon className="w-8 h-8 text-loss" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-loss" />
            <h3 className="font-bold text-lg text-loss">DRAWDOWN RECOVERY PROTOCOL ACTIVE</h3>
          </div>
          <p className="text-sm opacity-90">
            {drp.reason} The AI has restricted your recommended risk per trade to <strong>{drp.recommendedRiskLimit}%</strong> to protect your capital.
          </p>
          
          {drp.goldenSetup && (
            <div className="mt-2 text-sm bg-black/20 p-2 rounded-lg inline-block border border-loss/30">
              <span className="font-semibold text-loss">Golden Setup Override:</span> Until you recover, only trade <span className="font-bold">{drp.goldenSetup.pair}</span> during the <span className="font-bold">{drp.goldenSetup.session}</span> session using <span className="font-bold">{drp.goldenSetup.strategy}</span> strategy.
            </div>
          )}
        </div>
        
        <Link to="/ai-coach" className="shrink-0 mt-2 md:mt-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-loss text-white rounded-lg font-bold text-sm hover:bg-loss/80 transition-colors">
            View Analysis <ArrowUpRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
