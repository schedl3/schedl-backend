import { DateTime, Interval } from 'luxon';
import { Schedule } from '../users/schemas/user.schema';

export type ScheduleCSVByDay = Schedule;

export type WeekHour = number & { __weekHoursBrand: never };
export type Partial24hTime = string & { __partial24hTimeBrand: never };

export const validateWeekHour = (value: number): WeekHour => {
  if (value < 0 || value > 24 * 7) {
    throw new Error('WeekHour must be between 0 and 168.');
  }
  return value as WeekHour;
};

export const validatePartial24hTime = (value: string): Partial24hTime => {
  // Regular expression to match 24-hour time format
  const regex = /^(?:2[0-3]|[01]?[0-9])(?::([0-5]?[0-9]))?$/;

  if (!regex.test(value)) {
    throw new Error(value + ': Invalid partial 24-hour time format. Use HH or HH:mm format.');
  }

  return value as Partial24hTime;
};

export const toIsoHHmm = (p24HTime: Partial24hTime): string => {
  const [HH, mm] = p24HTime.split(':');
  const isoHHmm = HH.padStart(2, '0') + ':' + (mm === undefined ? '00' : mm);
  return isoHHmm;
}

export interface WeekHourRange {
  start: WeekHour;
  end: WeekHour;
}

export const validateWeekHourRange = ({ start, end }) => {
  validateWeekHour(start);
  validateWeekHour(end);
  return { start, end } as WeekHourRange;
}

// Given a day and a time return the number of hours from the beginning of the week.
export function toWeekHour(day: string, isoHHmm: string): WeekHour {
  // XXX luxon week starts Monday
  const dayIdx = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  // t0 is 00:00 today, t1 is the time X days from now
  const t0 = DateTime.fromFormat('00:00', 'HH:mm');
  const t1 = DateTime.fromFormat(isoHHmm, 'HH:mm').plus({ days: dayIdx[day] });
  const wh = validateWeekHour(Interval.fromDateTimes(t0, t1).length('hours'));
  return wh;
}

// [
//   { start: 148, end: 167.5 },
//   { start: 4, end: 23.5 },
//   { start: 33, end: 41.5 },
//   { start: 57, end: 65.5 },
//   { start: 81, end: 89.5 },
//   { start: 105, end: 113.5 },
//   { start: 129, end: 131.5 }
// ]
export function toWeekHourRanges(schedule: ScheduleCSVByDay) {
  const weekDays = Object.keys(schedule);
  const rangesByDay = {};

  weekDays.forEach((day) => {
    const csv = schedule[day];
    rangesByDay[day] = csv === '' ? [] : csv.split(",").map((partialRange) => {
      const [start, end] = partialRange.split("-").map((s) => {
        const p24HTime = validatePartial24hTime(s);
        return toWeekHour(day, toIsoHHmm(p24HTime));
      });
      return { start, end } as WeekHourRange;
    });
  });

  return [].concat(...Object.values(rangesByDay));
}

// returns hours not minutes, Detroit = -4
export function getOffsetFromUTC(tz: string) {
  const dt = DateTime.utc().setZone(tz);
  return dt.offset / 60;
}

// convert from non-utc to utc to all the available hour ranges during a 168 hour week
export function transformScheduleRangesFromTz(ranges: Array<WeekHourRange>, fromTz: string, toTz: string = 'UTC') {
  const offset = getOffsetFromUTC(fromTz) - getOffsetFromUTC(toTz);
  const hoursInWeek = 24 * 7;
  return ranges.map(({ start, end }: WeekHourRange) => ({
    start: start - offset,
    end: end - offset,
  } as WeekHourRange)).flatMap(({ start, end }: WeekHourRange): Array<WeekHourRange> => {
    if (start < 0 && end < 0) {
      return [validateWeekHourRange({ start: start + hoursInWeek, end: end + hoursInWeek })];
    } else if (start > hoursInWeek && end > hoursInWeek) {
      return [validateWeekHourRange({ start: start - hoursInWeek, end: end - hoursInWeek })];
    } else if (start < 0) {
      return [validateWeekHourRange({ start: start + hoursInWeek, end: hoursInWeek }), validateWeekHourRange({ start: 0, end: end })];
    } else if (end > hoursInWeek) {
      return [validateWeekHourRange({ start: start, end: hoursInWeek }), validateWeekHourRange({ start: 0, end: end - hoursInWeek })];
    }
    return [validateWeekHourRange({ start, end })];
  });
}

export function tzToday(tz: string, utcIsoDateTime?: string): DateTime {
  const utcDateTime = utcIsoDateTime ? DateTime.fromISO(utcIsoDateTime, { zone: 'utc' }) : DateTime.utc();
  const today = utcDateTime.setZone(tz).startOf('day');
  // console.log('today:', today.toISO());

  return today;
}

export function tzMonday(tz: string, utcIsoDateTime?: string): DateTime {
  const utcDateTime = utcIsoDateTime ? DateTime.fromISO(utcIsoDateTime, { zone: 'utc' }) : DateTime.utc();
  const mondayOfWeek = utcDateTime.setZone(tz).startOf('week');

  return mondayOfWeek;
}

export function tzWeekHour(tz: string, utcIsoDateTime?: string): WeekHour {
  const utcDateTime = utcIsoDateTime ? DateTime.fromISO(utcIsoDateTime, { zone: 'utc' }) : DateTime.utc();
  const hour = utcDateTime.setZone(tz).startOf('hour');
  const mondayOfWeek = tzMonday(tz, utcIsoDateTime);

  const wh = validateWeekHour(Interval.fromDateTimes(mondayOfWeek, hour).length('hours'));

  return wh;
}

export function tzHourInfo(tz: string, utcIsoDateTime?: string): { date: string; times: string[] } {
  const mondayOfWeek = tzMonday(tz, utcIsoDateTime);
  const wh = tzWeekHour(tz, utcIsoDateTime);
  const hourTime = mondayOfWeek.plus({ hours: wh });
  const dateWithoutTime = hourTime.toFormat('yyyy-MM-dd');
  const hour = hourTime.toFormat('HH:mm');

  return { date: dateWithoutTime, times: [hour] };
}

// ranges is pre-transformed from owner's time zone
export function availability(ranges: Array<WeekHourRange>, tz: string, utcIsoDateTime?: string): Record<string, Array<string[2][]>> {
  const result: Record<string, Array<string[2]>[]> = {};
  const mondayOfWeek = tzMonday(tz, utcIsoDateTime);
  const wh = tzWeekHour(tz, utcIsoDateTime);

  ranges.forEach(({ start, end }: WeekHourRange) => {
    let beNextWeek = 0;
    if (start > wh) {
      beNextWeek = 0;
    } else {
      beNextWeek = 7 * 24;
    }
    const tStart = mondayOfWeek.plus({ hours: start + beNextWeek });
    const tEnd = mondayOfWeek.plus({ hours: end + beNextWeek });
    const dateWithoutTime = tStart.toFormat('yyyy-MM-dd');
    if (result[dateWithoutTime] === undefined) {
      result[dateWithoutTime] = [];
    }
    result[dateWithoutTime].push([tStart.toFormat('HH:mm'), tEnd.toFormat('HH:mm')]);
  });

  // console.log('availability:', result);
  return orderObjectKeys(result);

}

function orderObjectKeys<T extends Record<string, any>>(obj: T): T {
  const orderedKeys = Object.keys(obj).sort();

  const orderedObject = orderedKeys.reduce((ordered, key) => {
    ordered[key as keyof T] = obj[key as keyof T];
    return ordered;
  }, {} as T);

  return orderedObject;
}
