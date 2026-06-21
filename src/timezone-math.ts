import { DateTime } from "luxon";

/**
 * toViewerHour(personTz, D, localHour, viewerTz):
 * Builds the person's local DateTime on day D, converts it to the viewer's timezone,
 * and returns the decimal hours offset from the viewer's midnight on day D.
 */
export function toViewerHour(personTz: string, dateStr: string, localHour: number, viewerTz: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const hourInt = Math.floor(localHour);
  const minuteInt = Math.round((localHour - hourInt) * 60);

  const personDt = DateTime.fromObject(
    { year, month, day, hour: hourInt, minute: minuteInt, second: 0 },
    { zone: personTz }
  );

  const viewerDt = personDt.setZone(viewerTz);
  const viewerMidnight = DateTime.fromObject(
    { year, month, day, hour: 0, minute: 0, second: 0 },
    { zone: viewerTz }
  );

  return viewerDt.diff(viewerMidnight, "hours").hours;
}

/**
 * isoToViewerHour(iso, D, viewerTz):
 * Calculates the decimal hours offset from the viewer's midnight on day D for any UTC/ISO string.
 */
export function isoToViewerHour(isoStr: string, dateStr: string, viewerTz: string): number {
  const dt = DateTime.fromISO(isoStr).setZone(viewerTz);
  const [year, month, day] = dateStr.split("-").map(Number);
  const viewerMidnight = DateTime.fromObject(
    { year, month, day, hour: 0, minute: 0, second: 0 },
    { zone: viewerTz }
  );

  return dt.diff(viewerMidnight, "hours").hours;
}

// Struct representing a unified event for availability calculation
export interface ExtractedEvent {
  title: string;
  startIso: string;
  endIso: string;
  isCustomMuted?: boolean;
  status?: string;
  eventType?: string;
  transparency?: string;
  responseStatus?: string; // 'accepted', 'tentative', 'needsAction', 'declined'
  isOptional?: boolean;
  attendeeCount?: number;
}

// Unified representation of a busy block derived from Google Calendar (events) or FreeBusy
export interface FilteredBusyBlock {
  title: string;
  startHourViewer: number; // Decimal hours from viewer's midnight
  endHourViewer: number;
  level: 0 | 1 | 2 | 3; // 4-level availability
  originalEvent?: ExtractedEvent;
}

/**
 * Apply the noise filter and classify event block availability levels.
 * This is based strictly on the Noise Filter rules.
 */
export function processGoogleEvents(
  events: ExtractedEvent[],
  dateStr: string,
  viewerTz: string,
  mutedTitles: string[] = [],
  broadcastThreshold: number = 15
): { blocks: FilteredBusyBlock[]; hiddenCount: number } {
  const blocks: FilteredBusyBlock[] = [];
  let hiddenCount = 0;

  for (const ev of events) {
    // 1. eventType in {workingLocation, birthday, fromGmail} -> HIDE
    const eventType = ev.eventType || "";
    if (["workingLocation", "birthday", "fromGmail"].includes(eventType)) {
      hiddenCount++;
      continue;
    }

    // 2. Custom muted titles
    if (mutedTitles.some(muted => ev.title.toLowerCase().includes(muted.toLowerCase()))) {
      hiddenCount++;
      continue;
    }

    // 3. status == "cancelled" -> HIDE
    if (ev.status === "cancelled") {
      hiddenCount++;
      continue;
    }

    // 4. my responseStatus == "declined" -> HIDE
    if (ev.responseStatus === "declined") {
      hiddenCount++;
      continue;
    }

    // Convert start and end times to viewer hours
    const startViewer = isoToViewerHour(ev.startIso, dateStr, viewerTz);
    const endViewer = isoToViewerHour(ev.endIso, dateStr, viewerTz);

    // Filter events that don't overlap with this day at all (in viewer clock terms, allow slight bleedover)
    if (endViewer <= 0 || startViewer >= 24) {
      continue;
    }

    // 5. eventType == "outOfOffice" -> UNAVAILABLE (level 3)
    if (eventType === "outOfOffice") {
      blocks.push({
        title: ev.title || "Out of Office",
        startHourViewer: startViewer,
        endHourViewer: endViewer,
        level: 3,
        originalEvent: ev,
      });
      continue;
    }

    // 6. transparency == "transparent" -> NON-BLOCKING (level <= 1)
    if (ev.transparency === "transparent") {
      blocks.push({
        title: ev.title || "Transparent/Free",
        startHourViewer: startViewer,
        endHourViewer: endViewer,
        level: 1, // Likely Free
        originalEvent: ev,
      });
      continue;
    }

    // 7. Opaque, default/focusTime:
    const resp = ev.responseStatus || "";
    const isOptional = ev.isOptional === true;
    const isBroadcast = (ev.attendeeCount || 0) >= broadcastThreshold;

    if (resp === "accepted") {
      blocks.push({
        title: ev.title || "Busy",
        startHourViewer: startViewer,
        endHourViewer: endViewer,
        level: 3, // Committed
        originalEvent: ev,
      });
    } else if (["needsAction", "tentative"].includes(resp) || isOptional || isBroadcast) {
      blocks.push({
        title: ev.title || "Tentative Slot",
        startHourViewer: startViewer,
        endHourViewer: endViewer,
        level: 2, // Tentative/optional
        originalEvent: ev,
      });
    } else {
      // Default fallback is busy (committed)
      blocks.push({
        title: ev.title || "Scheduling Block",
        startHourViewer: startViewer,
        endHourViewer: endViewer,
        level: 3,
        originalEvent: ev,
      });
    }
  }

  return { blocks, hiddenCount };
}

/**
 * Compute the 4-level availability (0-3) for a single person at any given decimal viewer hour.
 * - weekend OR h (in local time) not in any working segment -> 3
 * - else: check the busy blocks overlapping this hour:
 *   - any level 3 event -> 3
 *   - else any level 2 event -> 2
 *   - else any level 1 event -> 1
 *   - else -> 0
 */
export function getAvailabilityForHour(
  viewerHour: number,
  dateStr: string,
  personTz: string,
  viewerTz: string,
  segments: [number, number][],
  blocks: FilteredBusyBlock[]
): { level: 0 | 1 | 2 | 3; block?: FilteredBusyBlock } {
  // 1. Convert viewerHour on day dateStr back to person's local hour and day
  const [year, month, day] = dateStr.split("-").map(Number);
  const hourInt = Math.floor(viewerHour);
  const minuteInt = Math.round((viewerHour - hourInt) * 60);

  // Construct viewer date-time at this hour
  const viewerDt = DateTime.fromObject(
    { year, month, day, hour: hourInt, minute: minuteInt, second: 0 },
    { zone: viewerTz }
  );

  const localDt = viewerDt.setZone(personTz);

  // Check if weekend in local time
  const isWeekend = localDt.weekday === 6 || localDt.weekday === 7;

  // Local hour as decimal
  const localHourDecimal = localDt.hour + localDt.minute / 60;

  // Check if localHourDecimal fits in any segmented work hour
  const inWorkHour = segments.some(([start, end]) => {
    return localHourDecimal >= start && localHourDecimal < end;
  });

  if (isWeekend || !inWorkHour) {
    return { level: 3 }; // Busy/off
  }

  // 2. Find overlapping event blocks
  // An event covers hour h if start <= h and end > h
  const overlapping = blocks.filter(b => {
    return b.startHourViewer <= viewerHour && b.endHourViewer > viewerHour;
  });

  if (overlapping.length === 0) {
    return { level: 0 }; // Level 0 Free
  }

  // Rank overlapping blocks
  // level 3 dominates, then 2, then 1, then 0.
  let maxLevel: 0 | 1 | 2 | 3 = 0;
  let matchingBlock: FilteredBusyBlock | undefined;

  for (const b of overlapping) {
    if (b.level > maxLevel) {
      maxLevel = b.level;
      matchingBlock = b;
    }
  }

  return { level: maxLevel, block: matchingBlock };
}

/**
 * Calculates common overlapping free segments.
 * Scans 0..24 in 0.5h steps; a slot is "open" if every selected person has level <= 1.
 * Merges consecutive runs >= minDuration.
 */
export function findCommonFreeSlots(
  peopleAvailabilities: { personId: string; hourlyLevels: (0 | 1 | 2 | 3)[] }[],
  minDuration: number = 0.5
): { start: number; end: number; duration: number }[] {
  const steps = 48; // 24 hours * 2 steps per hour
  const isOpen = (stepIndex: number): boolean => {
    return peopleAvailabilities.every(p => {
      const lvl = p.hourlyLevels[stepIndex];
      return lvl <= 1; // Level 0 or 1 is free
    });
  };

  const slots: { start: number; end: number; duration: number }[] = [];
  let inSlot = false;
  let slotStart = 0;

  for (let i = 0; i < steps; i++) {
    const isFree = isOpen(i);
    const hour = i / 2;

    if (isFree && !inSlot) {
      inSlot = true;
      slotStart = hour;
    } else if (!isFree && inSlot) {
      const duration = hour - slotStart;
      if (duration >= minDuration) {
        slots.push({ start: slotStart, end: hour, duration });
      }
      inSlot = false;
    }
  }

  // Handle final open slot
  if (inSlot) {
    const duration = 24 - slotStart;
    if (duration >= minDuration) {
      slots.push({ start: slotStart, end: 24, duration });
    }
  }

  return slots;
}

/**
 * Ranks open free slots by:
 * 1. Duration (longer is better)
 * 2. Closeness to optimal midday interval (e.g., 10:00 - 15:00)
 */
export function rankBestSlots(
  slots: { start: number; end: number; duration: number }[]
): { start: number; end: number; duration: number; score: number }[] {
  const midDayOptimal = 12.5; // Optimal slot center is 12:30

  return slots
    .map(s => {
      const center = (s.start + s.end) / 2;
      const distFromMidDay = Math.abs(center - midDayOptimal);
      // Score formula: Duration weighted positive, distance from midday weighted negative
      const score = s.duration * 10 - distFromMidDay * 1.5;
      return { ...s, score };
    })
    .sort((a, b) => b.score - a.score);
}
