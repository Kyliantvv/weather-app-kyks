import { ENV } from '../config/env';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class CityNotFoundError extends Error {
  constructor(city: string) {
    super(`Ville introuvable : ${city}`);
    this.name = 'CityNotFoundError';
  }
}

export class WeatherNetworkError extends Error {
  constructor() {
    super('Problème de connexion réseau, veuillez réessayer');
    this.name = 'WeatherNetworkError';
  }
}

export interface WeatherSummary {
  cityId: number;
  city: string;
  country: string;
  temperatureCelsius: number;
  condition: string;
}

export interface WeatherDetails extends WeatherSummary {
  humidityPercent: number;
  windSpeedKmh: number;
}

export interface ForecastEntry {
  timestamp: number;
  temperatureCelsius: number;
}

function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}

function msToKmh(metersPerSecond: number): number {
  return Math.round(metersPerSecond * 3.6);
}

async function fetchWeather(queryParams: string, notFoundLabel: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/weather?${queryParams}&appid=${ENV.openWeatherApiKey}`);
  } catch {
    throw new WeatherNetworkError();
  }

  if (response.status === 404) {
    throw new CityNotFoundError(notFoundLabel);
  }

  if (!response.ok) {
    throw new WeatherNetworkError();
  }

  return response.json();
}

function toSummary(data: any): WeatherSummary {
  return {
    cityId: data.id,
    city: data.name,
    country: data.sys.country,
    temperatureCelsius: kelvinToCelsius(data.main.temp),
    condition: data.weather[0]?.description ?? '',
  };
}

export async function searchCity(city: string): Promise<WeatherSummary> {
  const data = await fetchWeather(`q=${encodeURIComponent(city)}`, city);
  return toSummary(data);
}

export async function getWeatherDetails(city: string): Promise<WeatherDetails> {
  const data = await fetchWeather(`q=${encodeURIComponent(city)}`, city);
  return {
    ...toSummary(data),
    humidityPercent: data.main.humidity,
    windSpeedKmh: msToKmh(data.wind.speed),
  };
}

export async function getWeatherByCoords(latitude: number, longitude: number): Promise<WeatherSummary> {
  const data = await fetchWeather(`lat=${latitude}&lon=${longitude}`, 'position actuelle');
  return toSummary(data);
}

export async function getWeatherDetailsByCoords(latitude: number, longitude: number): Promise<WeatherDetails> {
  const data = await fetchWeather(`lat=${latitude}&lon=${longitude}`, 'position actuelle');
  return {
    ...toSummary(data),
    humidityPercent: data.main.humidity,
    windSpeedKmh: msToKmh(data.wind.speed),
  };
}

export async function getForecast(city: string): Promise<ForecastEntry[]> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${ENV.openWeatherApiKey}`
    );
  } catch {
    throw new WeatherNetworkError();
  }

  if (response.status === 404) {
    throw new CityNotFoundError(city);
  }

  if (!response.ok) {
    throw new WeatherNetworkError();
  }

  const data = await response.json();
  return (data.list ?? []).map((entry: any) => ({
    timestamp: entry.dt * 1000,
    temperatureCelsius: kelvinToCelsius(entry.main.temp),
  }));
}
