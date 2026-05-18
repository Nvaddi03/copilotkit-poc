// FlightCard component for Controlled GenUI demo
// (Implementation will be added after planning)

"use client";

export type Flight = {
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  price: number;
};

export function FlightCard({ flight }: { flight: Flight }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-slate-500">
          {flight.airline} · {flight.flightNumber}
        </div>
        <div className="text-lg font-semibold text-slate-900">
          {flight.from} → {flight.to}
        </div>
        <div className="text-xs text-slate-500">
          {flight.depart} – {flight.arrive}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-brand-600">
          ${flight.price.toFixed(0)}
        </div>
        <button className="mt-1 text-xs px-3 py-1 rounded-md bg-brand-500 text-white hover:bg-brand-600">
          Select
        </button>
      </div>
    </div>
  );
}

export default FlightCard;
