"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { marketSeries } from "@/lib/data";

export function MarketChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={marketSeries} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="nasdaq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1f6feb" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1f6feb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d8aa46" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#d8aa46" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={{
              background: "#07111f",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8,
              color: "#eef3fb"
            }}
          />
          <Area type="monotone" dataKey="nasdaq" stroke="#1f6feb" fill="url(#nasdaq)" strokeWidth={2} />
          <Area type="monotone" dataKey="gold" stroke="#d8aa46" fill="url(#gold)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
