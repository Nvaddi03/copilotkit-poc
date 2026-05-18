"""
Weather MCP Tools — using Open-Meteo (free, no API key required).

Demonstrates how CopilotKit can integrate with an external real-time
data source via standard @tool decorators consumed by a LangGraph agent.
"""

import httpx
from langchain_core.tools import tool


# ── Geocoding helper ─────────────────────────────────────────────────────────

def _geocode(city: str) -> dict:
    """Return lat/lon for a city name via Open-Meteo geocoding API."""
    url = "https://geocoding-api.open-meteo.com/v1/search"
    r = httpx.get(url, params={"name": city, "count": 1, "language": "en", "format": "json"}, timeout=10)
    r.raise_for_status()
    results = r.json().get("results", [])
    if not results:
        raise ValueError(f"City not found: {city}")
    loc = results[0]
    return {"lat": loc["latitude"], "lon": loc["longitude"], "name": loc["name"], "country": loc.get("country", "")}


# ── Tool 1: Current weather ───────────────────────────────────────────────────

@tool
def get_current_weather(city: str) -> dict:
    """
    Get the current weather conditions for a city.
    Returns temperature (°C), apparent temperature, humidity (%),
    wind speed (km/h), wind direction (°), precipitation (mm),
    and a human-readable weather description.
    """
    loc = _geocode(city)
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": loc["lat"],
        "longitude": loc["lon"],
        "current": [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "precipitation",
            "wind_speed_10m",
            "wind_direction_10m",
            "weather_code",
        ],
        "timezone": "auto",
    }
    r = httpx.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()["current"]

    return {
        "city": f"{loc['name']}, {loc['country']}",
        "temperature_c": data["temperature_2m"],
        "feels_like_c": data["apparent_temperature"],
        "humidity_pct": data["relative_humidity_2m"],
        "precipitation_mm": data["precipitation"],
        "wind_speed_kmh": data["wind_speed_10m"],
        "wind_direction_deg": data["wind_direction_10m"],
        "condition": _wmo_description(data["weather_code"]),
        "weather_code": data["weather_code"],
    }


# ── Tool 2: 7-day forecast ────────────────────────────────────────────────────

@tool
def get_weather_forecast(city: str, days: int = 7) -> dict:
    """
    Get a daily weather forecast for a city (up to 16 days).
    Returns min/max temperature, precipitation sum, and condition per day.
    """
    days = max(1, min(days, 16))
    loc = _geocode(city)
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": loc["lat"],
        "longitude": loc["lon"],
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "weather_code",
        ],
        "forecast_days": days,
        "timezone": "auto",
    }
    r = httpx.get(url, params=params, timeout=10)
    r.raise_for_status()
    daily = r.json()["daily"]

    forecast = []
    for i in range(len(daily["time"])):
        forecast.append({
            "date": daily["time"][i],
            "max_temp_c": daily["temperature_2m_max"][i],
            "min_temp_c": daily["temperature_2m_min"][i],
            "precipitation_mm": daily["precipitation_sum"][i],
            "condition": _wmo_description(daily["weather_code"][i]),
        })

    return {
        "city": f"{loc['name']}, {loc['country']}",
        "forecast_days": days,
        "forecast": forecast,
    }


# ── Tool 3: Hourly temperature today ─────────────────────────────────────────

@tool
def get_hourly_temperature(city: str) -> dict:
    """
    Get hourly temperature (°C) and precipitation (mm) for today for a city.
    Useful for plotting an intraday temperature chart.
    """
    loc = _geocode(city)
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": loc["lat"],
        "longitude": loc["lon"],
        "hourly": ["temperature_2m", "precipitation"],
        "forecast_days": 1,
        "timezone": "auto",
    }
    r = httpx.get(url, params=params, timeout=10)
    r.raise_for_status()
    hourly = r.json()["hourly"]

    hours = []
    for i in range(len(hourly["time"])):
        hours.append({
            "hour": hourly["time"][i][-5:],   # "HH:MM"
            "temperature_c": hourly["temperature_2m"][i],
            "precipitation_mm": hourly["precipitation"][i],
        })

    return {
        "city": f"{loc['name']}, {loc['country']}",
        "hourly": hours,
    }


# ── Tool 4: Compare weather for two cities ───────────────────────────────────

@tool
def compare_cities_weather(city_a: str, city_b: str) -> dict:
    """
    Compare current weather between two cities side by side.
    Returns a comparison dict with temperature, humidity and conditions for both.
    """
    a = get_current_weather.invoke({"city": city_a})
    b = get_current_weather.invoke({"city": city_b})
    return {
        "comparison": [
            {k: v for k, v in a.items()},
            {k: v for k, v in b.items()},
        ],
        "warmer_city": a["city"] if a["temperature_c"] >= b["temperature_c"] else b["city"],
        "temperature_diff_c": round(abs(a["temperature_c"] - b["temperature_c"]), 1),
    }


# ── WMO weather code → human description ─────────────────────────────────────

def _wmo_description(code: int) -> str:
    table = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Icy fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
        95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
    }
    return table.get(code, f"Weather code {code}")
