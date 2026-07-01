jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

import * as Location from 'expo-location';
import { getCurrentCoordinates } from '../locationService';

describe('locationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns coordinates when permission is granted', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 48.85, longitude: 2.35 },
    });

    const result = await getCurrentCoordinates();

    expect(result).toEqual({ latitude: 48.85, longitude: 2.35 });
  });

  it('returns null when permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await getCurrentCoordinates();

    expect(result).toBeNull();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns null instead of throwing when the position is unavailable', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error('Current location is unavailable. Make sure that location services are enabled')
    );

    const result = await getCurrentCoordinates();

    expect(result).toBeNull();
  });
});
