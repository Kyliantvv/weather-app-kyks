import { render, screen } from '@testing-library/react-native';
import { WeatherChart } from '../WeatherChart';

describe('WeatherChart', () => {
  it('renders nothing when there are no entries', () => {
    const { toJSON } = render(<WeatherChart entries={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders a bar per forecast entry with its temperature', () => {
    render(
      <WeatherChart
        entries={[
          { timestamp: new Date('2026-07-01T12:00:00.000Z').getTime(), temperatureCelsius: 20 },
          { timestamp: new Date('2026-07-01T15:00:00.000Z').getTime(), temperatureCelsius: 25 },
        ]}
      />
    );

    expect(screen.getByTestId('weather-chart')).toBeTruthy();
    expect(screen.getByText('20°')).toBeTruthy();
    expect(screen.getByText('25°')).toBeTruthy();
  });
});
