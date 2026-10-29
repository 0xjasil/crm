export interface MetricCard {
  title: string;
  value: string;
  description: string;
  trend: {
    type: 'up' | 'down';
    value: string;
  };
  footer: {
    message: string;
    description: string;
  };
}
