import WeatherLab from '../components/weather/weather-lab';
// No request-time data: lets `output: 'export'` prerender the page.
export const dynamic = 'force-static';
export default function Home() {
  return <WeatherLab />;
}
