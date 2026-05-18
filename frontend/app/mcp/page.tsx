"use client";

import { useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

// ── Types ─────────────────────────────────────────────────────────────────
type CurrentWeather = {
  city: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_pct: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  condition: string;
};

type ForecastDay = {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  precipitation_mm: number;
  condition: string;
};

type HourlyPoint = { hour: string; temperature_c: number; precipitation_mm: number };

// ── Helper ────────────────────────────────────────────────────────────────
function toF(c: number) { return Math.round(c * 9 / 5 + 32); }

function conditionEmoji(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes("clear")) return "☀️";
  if (c.includes("partly")) return "⛅";
  if (c.includes("cloud") || c.includes("overcast")) return "☁️";
  if (c.includes("fog")) return "🌫️";
  if (c.includes("drizzle")) return "🌦️";
  if (c.includes("rain") || c.includes("shower")) return "🌧️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("thunder")) return "⛈️";
  return "🌡️";
}

// ── Inner component (needs CopilotKit context) ─────────────────────────────
function WeatherPageInner() {
  const [current, setCurrent]   = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourly, setHourly]     = useState<HourlyPoint[]>([]);
  const [compareA, setCompareA] = useState<CurrentWeather | null>(null);
  const [compareB, setCompareB] = useState<CurrentWeather | null>(null);
  const [activeCity, setActiveCity] = useState<string>("");

  // ── useCopilotReadable — expose UI state to agent ──────────────────
  useCopilotReadable({
    description: "Currently displayed city weather data",
    value: { activeCity, hasCurrent: !!current, hasForecast: forecast.length > 0, hasHourly: hourly.length > 0 },
  });

  // ── Action: render current weather card ───────────────────────────
  useCopilotAction({
    name: "renderCurrentWeather",
    description: "Display a current weather card for a city. Call this after get_current_weather.",
    parameters: [
      { name: "city",            type: "string", required: true },
      { name: "temperature_c",   type: "number", required: true },
      { name: "feels_like_c",    type: "number", required: true },
      { name: "humidity_pct",    type: "number", required: true },
      { name: "precipitation_mm",type: "number", required: true },
      { name: "wind_speed_kmh",  type: "number", required: true },
      { name: "condition",       type: "string", required: true },
    ],
    handler: async (args) => {
      setCurrent(args as CurrentWeather);
      setActiveCity(args.city as string);
      setForecast([]);
      setHourly([]);
      setCompareA(null);
      setCompareB(null);
      return `Weather card rendered for ${args.city}`;
    },
  });

  // ── Action: render forecast ────────────────────────────────────────
  useCopilotAction({
    name: "renderForecast",
    description: "Display a multi-day forecast table. Call this after get_weather_forecast.",
    parameters: [
      { name: "city",     type: "string",   required: true },
      { name: "forecast", type: "object[]", required: true,
        attributes: [
          { name: "date",             type: "string", required: true },
          { name: "max_temp_c",       type: "number", required: true },
          { name: "min_temp_c",       type: "number", required: true },
          { name: "precipitation_mm", type: "number", required: true },
          { name: "condition",        type: "string", required: true },
        ],
      },
    ],
    handler: async ({ city, forecast: days }) => {
      setActiveCity(city as string);
      setForecast(days as ForecastDay[]);
      setCurrent(null);
      setHourly([]);
      setCompareA(null);
      setCompareB(null);
      return `Forecast rendered for ${city}`;
    },
  });

  // ── Action: render hourly chart ────────────────────────────────────
  useCopilotAction({
    name: "renderHourlyChart",
    description: "Display an hourly temperature bar for today. Call after get_hourly_temperature.",
    parameters: [
      { name: "city",   type: "string",   required: true },
      { name: "hourly", type: "object[]", required: true,
        attributes: [
          { name: "hour",           type: "string", required: true },
          { name: "temperature_c",  type: "number", required: true },
          { name: "precipitation_mm", type: "number", required: true },
        ],
      },
    ],
    handler: async ({ city, hourly: hrs }) => {
      setActiveCity(city as string);
      setHourly(hrs as HourlyPoint[]);
      setCurrent(null);
      setForecast([]);
      setCompareA(null);
      setCompareB(null);
      return `Hourly chart rendered for ${city}`;
    },
  });

  // ── Action: render city comparison ────────────────────────────────
  useCopilotAction({
    name: "renderCityComparison",
    description: "Show a side-by-side comparison of two cities. Call after compare_cities_weather.",
    parameters: [
      { name: "city_a",        type: "object", required: true },
      { name: "city_b",        type: "object", required: true },
      { name: "warmer_city",   type: "string", required: true },
      { name: "temp_diff_c",   type: "number", required: true },
    ],
    handler: async ({ city_a, city_b, warmer_city, temp_diff_c }) => {
      setCompareA(city_a as CurrentWeather);
      setCompareB(city_b as CurrentWeather);
      setCurrent(null);
      setForecast([]);
      setHourly([]);
      return `Comparison rendered: ${(city_a as any).city} vs ${(city_b as any).city}`;
    },
  });

  // ── Min/max for hourly sparkline ───────────────────────────────────
  const minTemp = hourly.length ? Math.min(...hourly.map(h => h.temperature_c)) : 0;
  const maxTemp = hourly.length ? Math.max(...hourly.map(h => h.temperature_c)) : 1;

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      <section>
        <h1 className="text-3xl font-bold text-slate-900">🌤️ Weather External API Demo</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Powered by <strong>Open-Meteo</strong> (free, real-time, no API key). Ask for current conditions,
          forecasts, hourly charts, or compare two cities.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          Live data via Open-Meteo API · External tool integration demo
        </div>
      </section>

      {/* ── Quick prompts ── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Try these</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "☀️ Current — New York",     prompt: "What's the weather in New York right now?" },
            { label: "📅 7-day forecast — London", prompt: "Show me the 7-day weather forecast for London." },
            { label: "🕐 Hourly today — Tokyo",    prompt: "Show hourly temperature for Tokyo today." },
            { label: "⚖️ Compare — Dubai vs Oslo", prompt: "Compare the weather in Dubai and Oslo." },
            { label: "🌧️ Forecast — Mumbai",       prompt: "What's the weather forecast for Mumbai this week?" },
            { label: "❄️ Current — Reykjavik",     prompt: "What is the current weather in Reykjavik?" },
          ].map((q) => (
            <button
              key={q.label}
              onClick={() => {
                const input = document.querySelector<HTMLTextAreaElement>(".copilotKitInput textarea, .copilotKitInput input");
                if (input) {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
                    || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                  nativeInputValueSetter?.call(input, q.prompt);
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                  input.focus();
                }
              }}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition shadow-sm"
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Current weather card ── */}
      {current && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            {conditionEmoji(current.condition)} Current Weather — {current.city}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Temperature",    value: `${current.temperature_c}°C / ${toF(current.temperature_c)}°F`, icon: "🌡️" },
              { label: "Feels Like",     value: `${current.feels_like_c}°C / ${toF(current.feels_like_c)}°F`,   icon: "🤔" },
              { label: "Condition",      value: current.condition,                                               icon: conditionEmoji(current.condition) },
              { label: "Humidity",       value: `${current.humidity_pct}%`,                                     icon: "💧" },
              { label: "Precipitation",  value: `${current.precipitation_mm} mm`,                               icon: "🌧️" },
              { label: "Wind Speed",     value: `${current.wind_speed_kmh} km/h`,                               icon: "💨" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex items-start gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="font-semibold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Forecast table ── */}
      {forecast.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            📅 {forecast.length}-Day Forecast — {activeCity}
          </h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Condition</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">High</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Low</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Rain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecast.map((day, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">{day.date}</td>
                    <td className="px-4 py-3 text-slate-600">{conditionEmoji(day.condition)} {day.condition}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">{day.max_temp_c}°C</td>
                    <td className="px-4 py-3 text-right text-sky-600">{day.min_temp_c}°C</td>
                    <td className="px-4 py-3 text-right text-slate-500">{day.precipitation_mm} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Hourly chart ── */}
      {hourly.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">🕐 Hourly Temperature Today — {activeCity}</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
              {hourly.map((h, i) => {
                const pct = maxTemp === minTemp ? 50 : ((h.temperature_c - minTemp) / (maxTemp - minTemp)) * 100;
                const height = Math.max(8, Math.round(pct));
                return (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[28px]" title={`${h.hour}: ${h.temperature_c}°C`}>
                    <span className="text-[9px] text-slate-500 font-mono">{h.temperature_c}°</span>
                    <div
                      className="w-4 rounded-t-sm bg-sky-400 hover:bg-sky-500 transition"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-slate-400 font-mono rotate-0">{h.hour}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Min: {minTemp}°C / {toF(minTemp)}°F</span>
              <span>Max: {maxTemp}°C / {toF(maxTemp)}°F</span>
            </div>
          </div>
        </section>
      )}

      {/* ── City comparison ── */}
      {compareA && compareB && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">⚖️ City Comparison</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[compareA, compareB].map((city, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 text-base mb-3">
                  {conditionEmoji(city.condition)} {city.city}
                </h3>
                <ul className="space-y-2 text-sm">
                  {[
                    ["🌡️ Temperature",  `${city.temperature_c}°C / ${toF(city.temperature_c)}°F`],
                    ["🤔 Feels Like",    `${city.feels_like_c}°C / ${toF(city.feels_like_c)}°F`],
                    ["🌤️ Condition",    city.condition],
                    ["💧 Humidity",     `${city.humidity_pct}%`],
                    ["💨 Wind",         `${city.wind_speed_kmh} km/h`],
                  ].map(([label, val]) => (
                    <li key={label} className="flex justify-between">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">{val}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CopilotChat ── */}
      <CopilotChat
        instructions={`You are a real-time weather assistant using Open-Meteo data.

STRICT RULES:
1. ALWAYS call a tool first — never invent weather data.
2. After calling get_current_weather → call renderCurrentWeather with the exact same fields.
3. After calling get_weather_forecast → call renderForecast with city and forecast array.
4. After calling get_hourly_temperature → call renderHourlyChart with city and hourly array.
5. After calling compare_cities_weather → call renderCityComparison with city_a, city_b objects, warmer_city, temp_diff_c.

Always show temperatures in both °C and °F. Be friendly and concise.`}
        labels={{
          title: "🌤️ Weather Assistant",
          initial: "Hi! Ask me about the weather anywhere in the world. Try: \"What's the weather in Sydney?\" 🌏",
        }}
        className="h-[520px] rounded-xl border border-slate-200 shadow-sm"
      />
    </div>
  );
}

// ── Page component ──────────────────────────────────────────────────────────
// Agent is set to "weather-agent" via ClientLayoutWrapper based on /mcp route
export default function WeatherMCPPage() {
  return <WeatherPageInner />;
}
