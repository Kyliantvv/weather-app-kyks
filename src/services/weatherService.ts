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

function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}

function msToKmh(metersPerSecond: number): number {
  return Math.round(metersPerSecond * 3.6);
}

async function fetchWeatherByCity(city: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${ENV.openWeatherApiKey}`);
  } catch {
    throw new WeatherNetworkError();
  }

  if (response.status === 404) {
    throw new CityNotFoundError(city);
  }

  if (!response.ok) {
    throw new WeatherNetworkError();
  }

  return response.json();
}

export async function searchCity(city: string): Promise<WeatherSummary> {
  const data = await fetchWeatherByCity(city);
  return {
    cityId: data.id,
    city: data.name,
    country: data.sys.country,
    temperatureCelsius: kelvinToCelsius(data.main.temp),
    condition: data.weather[0]?.description ?? '',
  };
}

export async function getWeatherDetails(city: string): Promise<WeatherDetails> {
  const data = await fetchWeatherByCity(city);
  return {
    cityId: data.id,
    city: data.name,
    country: data.sys.country,
    temperatureCelsius: kelvinToCelsius(data.main.temp),
    condition: data.weather[0]?.description ?? '',
    humidityPercent: data.main.humidity,
    windSpeedKmh: msToKmh(data.wind.speed),
  };
}
