jest.mock('../../config/env', () => ({ ENV: { openWeatherApiKey: 'test-key' } }));

import {
  searchCity,
  getWeatherDetails,
  getWeatherByCoords,
  getForecast,
  CityNotFoundError,
  WeatherNetworkError,
} from '../weatherService';

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('weatherService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('searchCity returns a formatted summary', async () => {
    mockFetchOnce(200, {
      id: 42,
      name: 'Paris',
      sys: { country: 'FR' },
      main: { temp: 293.15, humidity: 60 },
      weather: [{ description: 'ciel dégagé' }],
      wind: { speed: 5 },
    });

    const result = await searchCity('Paris');

    expect(result).toEqual({
      cityId: 42,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 20,
      condition: 'ciel dégagé',
    });
  });

  it('searchCity throws CityNotFoundError on a 404 response', async () => {
    mockFetchOnce(404, {});

    await expect(searchCity('Villeinexistante')).rejects.toBeInstanceOf(CityNotFoundError);
  });

  it('getWeatherDetails includes humidity and wind speed in km/h', async () => {
    mockFetchOnce(200, {
      id: 42,
      name: 'Paris',
      sys: { country: 'FR' },
      main: { temp: 293.15, humidity: 60 },
      weather: [{ description: 'ciel dégagé' }],
      wind: { speed: 5 },
    });

    const result = await getWeatherDetails('Paris');

    expect(result.humidityPercent).toBe(60);
    expect(result.windSpeedKmh).toBe(18);
  });

  it('throws WeatherNetworkError when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(searchCity('Paris')).rejects.toBeInstanceOf(WeatherNetworkError);
  });

  it('getWeatherByCoords queries by lat/lon and returns a formatted summary', async () => {
    mockFetchOnce(200, {
      id: 42,
      name: 'Paris',
      sys: { country: 'FR' },
      main: { temp: 293.15, humidity: 60 },
      weather: [{ description: 'ciel dégagé' }],
      wind: { speed: 5 },
    });

    const result = await getWeatherByCoords(48.85, 2.35);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('lat=48.85&lon=2.35'));
    expect(result.city).toBe('Paris');
  });

  it('getForecast returns a list of timestamped temperatures', async () => {
    mockFetchOnce(200, {
      list: [
        { dt: 1000, main: { temp: 293.15 } },
        { dt: 2000, main: { temp: 283.15 } },
      ],
    });

    const result = await getForecast('Paris');

    expect(result).toEqual([
      { timestamp: 1000000, temperatureCelsius: 20 },
      { timestamp: 2000000, temperatureCelsius: 10 },
    ]);
  });

  it('getForecast throws CityNotFoundError on a 404 response', async () => {
    mockFetchOnce(404, {});

    await expect(getForecast('Villeinexistante')).rejects.toBeInstanceOf(CityNotFoundError);
  });
});
