
import { useEffect, useState } from 'react'
import './App.css'

type WeatherData = {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
}

const weatherDescription = (code: number) => {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  if (code <= 99) return 'Thunderstorms'
  return 'Unknown conditions'
}

function App() {
  const [cityInput, setCityInput] = useState('')
  const [city, setCity] = useState('Lagos')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [locationName, setLocationName] = useState('Lagos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function getWeather() {
      setLoading(true)
      setError('')

      try {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        )
        if (!geoResponse.ok) throw new Error('Could not search for this city.')

        const geoData = await geoResponse.json()
        const place = geoData.results?.[0]

        if (!place) throw new Error(`We couldn't find "${city}". Try another city.`)

        const params = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,weather_code',
          forecast_days: '4',
          timezone: 'auto',
        })

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`
        )
        if (!response.ok) throw new Error('Could not load the weather. Try again.')

        const data: WeatherData = await response.json()

        if (!cancelled) {
          setWeather(data)
          setLocationName(place.name + (place.country ? `, ${place.country}` : ''))
        }
      } catch (err) {
        if (!cancelled) {
          setWeather(null)
          setError(err instanceof Error ? err.message : 'Something went wrong.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    getWeather()

    return () => {
      cancelled = true
    }
  }, [city])

  function searchCity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = cityInput.trim()
    if (trimmed) setCity(trimmed)
  }

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">☀</span>
          <span>Weatherly</span>
        </div>
        <span className="source">Powered by Open-Meteo</span>
      </header>

      <section className="search-section">
        <h1>Your daily weather</h1>
        <p>Find current conditions and the forecast for any city.</p>
        <form className="search-form" onSubmit={searchCity}>
          <input
            aria-label="Search city"
            placeholder="Enter a city, e.g. Lagos"
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
          />
          <button type="submit" disabled={!cityInput.trim() || loading}>
            Search
          </button>
        </form>
      </section>

      {loading && <p className="status">Loading weather...</p>}

      {!loading && error && (
        <section className="error-card" role="alert">
          <h2>Weather unavailable</h2>
          <p>{error}</p>
          <button onClick={() => setCity((current) => current)}>Try again</button>
        </section>
      )}

      {!loading && weather && (
        <>
          <section className="current-card">
            <div>
              <p className="eyebrow">CURRENT WEATHER</p>
              <h2>{locationName}</h2>
              <p className="condition">
                {weatherDescription(weather.daily.weather_code[0])}
              </p>
              <div className="temperature">
                {Math.round(weather.current.temperature_2m)}°C
              </div>
            </div>
            <div className="weather-icon" aria-hidden="true">
              {weather.daily.weather_code[0] === 0 ? '☀️' : '🌤️'}
            </div>
            <div className="weather-details">
              <div>
                <span>Humidity</span>
                <strong>{weather.current.relative_humidity_2m}%</strong>
              </div>
              <div>
                <span>Wind speed</span>
                <strong>{weather.current.wind_speed_10m} km/h</strong>
              </div>
            </div>
          </section>

          <section className="forecast-section">
            <h2>3-day forecast</h2>
            <div className="forecast-grid">
              {weather.daily.time.slice(0, 3).map((date, index) => (
                <article className="forecast-card" key={date}>
                  <h3>
                    {index === 0
                      ? 'Today'
                      : new Date(`${date}T12:00:00`).toLocaleDateString(
                          'en',
                          { weekday: 'long' }
                        )}
                  </h3>
                  <span className="forecast-icon" aria-hidden="true">
                    {weather.daily.weather_code[index] === 0 ? '☀️' : '🌤️'}
                  </span>
                  <p>{weatherDescription(weather.daily.weather_code[index])}</p>
                  <div className="temperatures">
                    <strong>{Math.round(weather.daily.temperature_2m_max[index])}°</strong>
                    <span>{Math.round(weather.daily.temperature_2m_min[index])}°</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <footer>Weather data provided by Open-Meteo</footer>
    </main>
  )
}

export default App
