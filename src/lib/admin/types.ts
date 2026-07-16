export type DatePreset = 'day' | 'week' | 'month' | 'year' | 'custom';

export type DateRange = {
	preset: DatePreset;
	startDate: string; // YYYY-MM-DD
	endDate: string;
};

export type OverviewMetrics = {
	activeUsers: number;
	sessions: number;
	screenPageViews: number;
	engagedSessions: number;
	conversions: number;
	eventCount: number;
	engagementRate: number;
	source: 'ga4' | 'demo';
};

export type ChannelRow = {
	channel: string;
	sessions: number;
	users: number;
	engagedSessions: number;
	conversions: number;
	eventCount: number;
};

export type EventRow = {
	eventName: string;
	eventCount: number;
	users: number;
	isConversion: boolean;
	byChannel: Array<{ channel: string; eventCount: number }>;
};

export type ConnectorId = 'ga4' | 'search_console' | 'google_ads' | 'meta_ads';

export type ConnectorStatus = {
	id: ConnectorId;
	label: string;
	description: string;
	connected: boolean;
	mode: 'live' | 'demo' | 'disconnected';
	lastSync: string | null;
	detail: string;
};

export type AdsRow = {
	campaign: string;
	impressions: number;
	clicks: number;
	cost: number;
	ctr: number;
};

export type GscRow = {
	query: string;
	clicks: number;
	impressions: number;
	ctr: number;
	position: number;
};
