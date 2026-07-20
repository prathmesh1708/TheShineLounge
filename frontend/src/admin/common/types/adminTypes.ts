export interface AdminStat {
  label: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
  icon?: any;
}

export interface AdminServiceModule {
  id: string;
  name: string;
  stats: AdminStat[];
  packages: any[];
  bookings: any[];
}
