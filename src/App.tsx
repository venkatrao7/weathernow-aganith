import React, { useState } from "react";
import "./styles.css";

/**
 * 🌦️ WeatherNow — Real-Time Weather App
 * Candidate ID: Naukri1025
 * Uses Open-Meteo APIs for city lookup + live weather info.
 */

type WeatherState = {
  temperature?: number;
  windspeed?: number;
  winddirection?: number;
  weathercode?: number;
  time?: string;
  city?: string;
  country?: string;
} | null;

export default function App(): JSX.Element {
  const [cityInput, setCityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherState>(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  /** 🌤️ Weather descriptions */
  const weatherDescriptions: Record<number, { text: string; icon: string }> = {
    0: { text: "Clear sky", icon: "☀️" },
    1: { text: "Mainly clear", icon: "🌤️" },
    2: { text: "Partly cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },
    45: { text: "Fog", icon: "🌫️" },
    48: { text: "Depositing rime fog", icon: "🌫️" },
    51: { text: "Light drizzle", icon: "🌦️" },
    53: { text: "Moderate drizzle", icon: "🌦️" },
    55: { text: "Dense drizzle", icon: "🌧️" },
    61: { text: "Slight rain", icon: "🌧️" },
    63: { text: "Moderate rain", icon: "🌧️" },
    65: { text: "Heavy rain", icon: "🌧️" },
    71: { text: "Slight snow fall", icon: "🌨️" },
    73: { text: "Moderate snow fall", icon: "❄️" },
    75: { text: "Heavy snow fall", icon: "❄️" },
    95: { text: "Thunderstorm", icon: "⛈️" },
  };

  /** 🔍 Fetch weather data */
  const handleGetWeather = async () => {
    const city = cityInput.trim();
    if (!city) {
      setError("Please enter a city name.");
      setWeather(null);
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // 1️⃣ Geocoding API to get latitude & longitude
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=1&language=en&format=json`;

      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error("Geocoding failed");

      const geoJson = await geoRes.json();
      if (!geoJson.results || geoJson.results.length === 0) {
        setError("City not found. Try a different name.");
        setLoading(false);
        return;
      }

      const best = geoJson.results[0];
      const { latitude, longitude, name, country } = best;

      // 2️⃣ Weather API for current weather
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;

      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error("Weather fetch failed");

      const weatherJson = await weatherRes.json();
      if (!weatherJson.current_weather) {
        setError("Weather data not available for this location.");
        setLoading(false);
        return;
      }

      const w = weatherJson.current_weather;
      setWeather({
        temperature: w.temperature,
        windspeed: w.windspeed,
        winddirection: w.winddirection,
        weathercode: w.weathercode,
        time: w.time,
        city: name,
        country,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to fetch weather data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  /** ⌨️ Handle Enter key press */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGetWeather();
    }
  };

  /** 🌈 Pick background based on weather code */
  const getBackground = (code?: number) => {
    if (code === undefined) return "app-root clear";
    if (code >= 0 && code <= 3) return "app-root clear";
    if (code >= 45 && code <= 48) return "app-root fog";
    if (code >= 51 && code <= 67) return "app-root rain";
    if (code >= 71 && code <= 77) return "app-root snow";
    if (code >= 95) return "app-root storm";
    return "app-root clear";
  };

  /** 🏙️ Handle city input & suggestions */
  const handleCityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCityInput(value);
    setError("");
    setSuggestions([]);

    if (value.length < 3) return; // Only search after 3 characters

    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          value
        )}&count=5&language=en&format=json`
      );
      const data = await res.json();
      if (data.results) setSuggestions(data.results);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  /** 🖱️ Handle suggestion click */
  const handleSuggestionClick = (name: string) => {
    setCityInput(name);
    setSuggestions([]);
  };

  /** 🌤️ UI Render */
  return (
    <div className={getBackground(weather?.weathercode)}>
      {/* Header */}
      <header className="header">
        <h1>🌦️ WeatherNow</h1>
        <p className="subtitle">
          Real-time weather lookup — powered by Open-Meteo
        </p>
      </header>

      {/* Main Section */}
      <main className="main-card">
        {/* Input Controls */}
        <div className="controls">
          <input
            type="text"
            placeholder="Enter city name, e.g., Hyderabad"
            value={cityInput}
            onChange={handleCityChange}
            onKeyDown={handleKeyPress}
            aria-label="City name"
          />
          <button onClick={handleGetWeather} disabled={loading}>
            {loading ? "Loading…" : "Get Weather"}
          </button>

          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((s) => (
                <li key={s.id} onClick={() => handleSuggestionClick(s.name)}>
                  {s.name}, {s.country}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error Message */}
        {error && <div className="error">{error}</div>}

        {/* Weather Info */}
        {weather && (
          <div className="weather-box" role="region" aria-live="polite">
            <h2>
              {weather.city}, {weather.country}
            </h2>

            <div className="weather-row">
              <div className="weather-item">
                <div className="label">Condition</div>
                <div className="value">
                  {weatherDescriptions[weather.weathercode || 0]?.icon}{" "}
                  {weatherDescriptions[weather.weathercode || 0]?.text}
                </div>
              </div>

              <div className="weather-item">
                <div className="label">Temperature</div>
                <div className="value">{weather.temperature}°C</div>
              </div>

              <div className="weather-item">
                <div className="label">Wind</div>
                <div className="value">
                  {weather.windspeed} km/h ({weather.winddirection}°)
                </div>
              </div>

              <div className="weather-item">
                <div className="label">Last Update</div>
                <div className="value">{weather.time}</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          Candidate ID: <strong>Naukri1025</strong>
        </footer>
      </main>

      {/* Note */}
      <aside className="note">
        Tip: Use correct city names ("New York" not "Newyork"). Some names exist
        in multiple countries.
      </aside>
    </div>
  );
}
