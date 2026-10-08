export type EarthInspection = {
  longitude: number;
  latitude: number;
  kind: 'relief' | 'building' | 'cloud' | 'local';
  value: number;
  title: string;
  note: string;
  source: string;
  index?: number;
};
