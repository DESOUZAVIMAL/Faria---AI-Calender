export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  viewer_tz: string;
  role: string;
}

export interface UserPreferences {
  userId: string;
  muted_titles: string[];
  muted_calendar_ids: string[];
  broadcast_threshold: number;
  only_accepted: boolean;
  hide_optional: boolean;
  working_hours_only: boolean;
}

export interface TeammateRow {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: "you" | "manager" | "team";
  segments: [number, number][];
  blocks?: FilteredBusyBlock[];
  hourlyLevels?: (0 | 1 | 2 | 3)[];
}

export interface ExtractedEvent {
  title: string;
  startIso: string;
  endIso: string;
  status?: string;
  eventType?: string;
  transparency?: string;
  responseStatus?: string;
  isOptional?: boolean;
}

export interface FilteredBusyBlock {
  title: string;
  startHourViewer: number; // Decimal hours from viewer midnight
  endHourViewer: number;
  level: 0 | 1 | 2 | 3;
  originalEvent?: ExtractedEvent;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  rows: TeammateRow[];
  freeSlots: { start: number; end: number; duration: number }[];
  bestSlots: { start: number; end: number; duration: number; score: number }[];
  hiddenCount: number;
}

export interface WeekDaySummary {
  date: string;
  dayName: string; // Mon, Tue...
  formattedDate: string; // Jun 17
  hourlyFreeCounts: number[]; // Index 0..23 of how many people are free
  bestSlot: { start: number; end: number; duration: number; score: number } | null;
  totalSelected: number;
}

export interface KeyWeekSlots {
  date: string;
  formattedDate: string;
  dayName: string;
  slot: { start: number; end: number; duration: number; score: number };
}

export interface WeekApiResponse {
  start: string;
  days: WeekDaySummary[];
  rankedSummary: KeyWeekSlots[];
}

export interface IncludedCalendar {
  id: string;
  summary: string;
  include: boolean;
}

