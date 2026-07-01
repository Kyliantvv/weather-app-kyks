import { requireEnv } from '../env';

describe('requireEnv', () => {
  it('returns the value when defined', () => {
    expect(requireEnv('X', 'value')).toBe('value');
  });

  it('throws when the value is undefined', () => {
    expect(() => requireEnv('X', undefined)).toThrow('Missing required environment variable: X');
  });

  it('throws when the value is an empty string', () => {
    expect(() => requireEnv('X', '')).toThrow('Missing required environment variable: X');
  });
});
