import React from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface RadarData {
  subject: string;
  A: number;
  fullMark: number;
}

interface TraderRadarChartProps {
  data: {
    consistency: number;
    discipline: number;
    ruleAdherence: number;
    revengeRisk: number;
    riskManagement: number;
  };
}

export function TraderRadarChart({ data }: TraderRadarChartProps) {
  const chartData: RadarData[] = [
    { subject: "Consistency", A: data.consistency, fullMark: 100 },
    { subject: "Discipline", A: data.discipline, fullMark: 100 },
    { subject: "Rule Adherence", A: data.ruleAdherence, fullMark: 100 },
    { subject: "Risk Management", A: data.riskManagement, fullMark: 100 },
    { subject: "Psychology", A: 100 - data.revengeRisk, fullMark: 100 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Trader Profile"
            dataKey="A"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
