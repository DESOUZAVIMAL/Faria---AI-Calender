import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";

const DB_FILE = path.join(process.cwd(), "db.json");

// Interface Definitions
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  viewer_tz: string;
  role: string; // 'you', 'manager', 'team'
  encrypted_refresh_token?: string;
}

export interface WorkHours {
  userId: string;
  segments: [number, number][]; // e.g. [[9, 12], [14, 18]]
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

export interface IncludedCalendar {
  calendarId: string;
  include: boolean;
  summary: string;
}

export interface RosterPerson {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: "manager" | "team";
  segments: [number, number][];
}

interface DatabaseSchema {
  users: { [id: string]: User };
  work_hours: { [userId: string]: WorkHours };
  preferences: { [userId: string]: UserPreferences };
  included_calendars: { [userId: string]: IncludedCalendar[] };
  roster: RosterPerson[];
}

// AES-256-CBC Encryption helpers for token-at-rest encryption
function getCipherKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getCipherKey(), iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptToken(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 2) return "";
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getCipherKey(), iv);
    let decrypted = decipher.update(encryptedText).toString();
    decrypted += decipher.final().toString();
    return decrypted;
  } catch (err) {
    console.error("Token decryption failed:", err);
    return "";
  }
}

// Initial Seed data containing standard global remote teammates (using generic addresses)
const DEFAULT_ROSTER: RosterPerson[] = [
  {
    id: "chloe-lon",
    name: "Chloe Stirling",
    email: "chloe@example.com",
    timezone: "Europe/London",
    role: "manager",
    segments: [[9, 12], [14, 17]], // Fragmented hours
  },
  {
    id: "kenji-tok",
    name: "Kenji Sato",
    email: "kenji@example.com",
    timezone: "Asia/Tokyo",
    role: "team",
    segments: [[9, 18]],
  },
  {
    id: "aarav-blr",
    name: "Aarav Nair",
    email: "aarav@example.com",
    timezone: "Asia/Kolkata",
    role: "team",
    segments: [[10, 13], [15, 19]], // Fragmented hours
  },
  {
    id: "sarah-nyc",
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    timezone: "America/New_York",
    role: "team",
    segments: [[9, 17]],
  },
  {
    id: "alex-sfo",
    name: "Alex Rivera",
    email: "alex@example.com",
    timezone: "America/Los_Angeles",
    role: "team",
    segments: [[9, 17]],
  },
];

// Unified Storage Interface
export interface Storage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  saveUser(user: User): Promise<void>;
  getWorkHours(userId: string): Promise<WorkHours>;
  saveWorkHours(userId: string, segments: [number, number][]): Promise<void>;
  getPreferences(userId: string): Promise<UserPreferences>;
  savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences>;
  getIncludedCalendars(userId: string): Promise<IncludedCalendar[]>;
  saveIncludedCalendars(userId: string, calendars: IncludedCalendar[]): Promise<void>;
  getRoster(): Promise<RosterPerson[]>;
  addRosterPerson(person: Omit<RosterPerson, "id">): Promise<RosterPerson>;
  updateRosterPerson(id: string, updated: Partial<RosterPerson>): Promise<void>;
  deleteRosterPerson(id: string): Promise<void>;
}

// implementation 1: JSON File Storage
export class FileStorage implements Storage {
  private async readDB(): Promise<DatabaseSchema> {
    try {
      if (!fs.existsSync(DB_FILE)) {
        const initial: DatabaseSchema = {
          users: {},
          work_hours: {},
          preferences: {},
          included_calendars: {},
          roster: DEFAULT_ROSTER,
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
        return initial;
      }
      const content = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(content) as DatabaseSchema;
      if (!parsed.roster || parsed.roster.length === 0) {
        parsed.roster = DEFAULT_ROSTER;
      }
      return parsed;
    } catch (err) {
      console.error("Error reading database file, returning default:", err);
      return {
        users: {},
        work_hours: {},
        preferences: {},
        included_calendars: {},
        roster: DEFAULT_ROSTER,
      };
    }
  }

  private async writeDB(data: DatabaseSchema): Promise<void> {
    try {
      const tempFile = DB_FILE + ".tmp";
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("Error saving database file:", err);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const db = await this.readDB();
    return db.users[id];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.readDB();
    return Object.values(db.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async saveUser(user: User): Promise<void> {
    const db = await this.readDB();
    db.users[user.id] = user;
    await this.writeDB(db);
  }

  async getWorkHours(userId: string): Promise<WorkHours> {
    const db = await this.readDB();
    const existing = db.work_hours[userId];
    if (existing) return existing;
    return {
      userId,
      segments: [[9, 17]],
    };
  }

  async saveWorkHours(userId: string, segments: [number, number][]): Promise<void> {
    const db = await this.readDB();
    db.work_hours[userId] = { userId, segments };
    await this.writeDB(db);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const db = await this.readDB();
    const existing = db.preferences[userId];
    if (existing) return existing;
    return {
      userId,
      muted_titles: ["Review", "Standup Sync", "Focus", "Catch Up"],
      muted_calendar_ids: [],
      broadcast_threshold: 15,
      only_accepted: false,
      hide_optional: false,
      working_hours_only: false,
    };
  }

  async savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const db = await this.readDB();
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...prefs };
    db.preferences[userId] = updated;
    await this.writeDB(db);
    return updated;
  }

  async getIncludedCalendars(userId: string): Promise<IncludedCalendar[]> {
    const db = await this.readDB();
    return db.included_calendars[userId] || [];
  }

  async saveIncludedCalendars(userId: string, calendars: IncludedCalendar[]): Promise<void> {
    const db = await this.readDB();
    db.included_calendars[userId] = calendars;
    await this.writeDB(db);
  }

  async getRoster(): Promise<RosterPerson[]> {
    const db = await this.readDB();
    return db.roster;
  }

  async addRosterPerson(person: Omit<RosterPerson, "id">): Promise<RosterPerson> {
    const db = await this.readDB();
    const newPerson: RosterPerson = {
      ...person,
      id: "roster-" + Math.random().toString(36).substring(2, 11),
    };
    db.roster.push(newPerson);
    await this.writeDB(db);
    return newPerson;
  }

  async updateRosterPerson(id: string, updated: Partial<RosterPerson>): Promise<void> {
    const db = await this.readDB();
    const index = db.roster.findIndex((p) => p.id === id);
    if (index !== -1) {
      db.roster[index] = { ...db.roster[index], ...updated } as RosterPerson;
      await this.writeDB(db);
    }
  }

  async deleteRosterPerson(id: string): Promise<void> {
    const db = await this.readDB();
    db.roster = db.roster.filter((p) => p.id !== id);
    await this.writeDB(db);
  }
}

// implementation 2: Postgres Database Storage
export class PostgresStorage implements Storage {
  private pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
    });
    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS fc_users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          picture TEXT,
          viewer_tz VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL,
          encrypted_refresh_token TEXT
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS fc_work_hours (
          user_id VARCHAR(100) PRIMARY KEY,
          segments TEXT NOT NULL
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS fc_preferences (
          user_id VARCHAR(100) PRIMARY KEY,
          muted_titles TEXT NOT NULL,
          muted_calendar_ids TEXT NOT NULL,
          broadcast_threshold INTEGER NOT NULL,
          only_accepted BOOLEAN NOT NULL,
          hide_optional BOOLEAN NOT NULL,
          working_hours_only BOOLEAN NOT NULL
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS fc_included_calendars (
          user_id VARCHAR(100),
          calendar_id VARCHAR(255),
          include BOOLEAN NOT NULL,
          summary TEXT NOT NULL,
          PRIMARY KEY (user_id, calendar_id)
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS fc_roster (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          timezone VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL,
          segments TEXT NOT NULL
        );
      `);

      // Seed fc_roster if empty
      const res = await client.query("SELECT COUNT(*) FROM fc_roster");
      if (parseInt(res.rows[0].count) === 0) {
        for (const person of DEFAULT_ROSTER) {
          await client.query(
            "INSERT INTO fc_roster (id, name, email, timezone, role, segments) VALUES ($1, $2, $3, $4, $5, $6)",
            [person.id, person.name, person.email, person.timezone, person.role, JSON.stringify(person.segments)]
          );
        }
      }
    } catch (err) {
      console.error("Failed to initialize PostgreSQL tables:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const res = await this.pool.query("SELECT * FROM fc_users WHERE id = $1", [id]);
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      picture: r.picture || undefined,
      viewer_tz: r.viewer_tz,
      role: r.role,
      encrypted_refresh_token: r.encrypted_refresh_token || undefined,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const res = await this.pool.query("SELECT * FROM fc_users WHERE LOWER(email) = LOWER($1)", [email]);
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      picture: r.picture || undefined,
      viewer_tz: r.viewer_tz,
      role: r.role,
      encrypted_refresh_token: r.encrypted_refresh_token || undefined,
    };
  }

  async saveUser(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO fc_users (id, email, name, picture, viewer_tz, role, encrypted_refresh_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET email=$2, name=$3, picture=$4, viewer_tz=$5, role=$6, encrypted_refresh_token=$7`,
      [user.id, user.email, user.name, user.picture || null, user.viewer_tz, user.role, user.encrypted_refresh_token || null]
    );
  }

  async getWorkHours(userId: string): Promise<WorkHours> {
    const res = await this.pool.query("SELECT * FROM fc_work_hours WHERE user_id = $1", [userId]);
    if (res.rows.length === 0) {
      return { userId, segments: [[9, 17]] };
    }
    return {
      userId,
      segments: JSON.parse(res.rows[0].segments),
    };
  }

  async saveWorkHours(userId: string, segments: [number, number][]): Promise<void> {
    await this.pool.query(
      `INSERT INTO fc_work_hours (user_id, segments) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET segments=$2`,
      [userId, JSON.stringify(segments)]
    );
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const res = await this.pool.query("SELECT * FROM fc_preferences WHERE user_id = $1", [userId]);
    if (res.rows.length === 0) {
      return {
        userId,
        muted_titles: ["Review", "Standup Sync", "Focus", "Catch Up"],
        muted_calendar_ids: [],
        broadcast_threshold: 15,
        only_accepted: false,
        hide_optional: false,
        working_hours_only: false,
      };
    }
    const r = res.rows[0];
    return {
      userId: r.user_id,
      muted_titles: JSON.parse(r.muted_titles),
      muted_calendar_ids: JSON.parse(r.muted_calendar_ids),
      broadcast_threshold: r.broadcast_threshold,
      only_accepted: r.only_accepted,
      hide_optional: r.hide_optional,
      working_hours_only: r.working_hours_only,
    };
  }

  async savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...prefs };
    await this.pool.query(
      `INSERT INTO fc_preferences (user_id, muted_titles, muted_calendar_ids, broadcast_threshold, only_accepted, hide_optional, working_hours_only)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         muted_titles=$2, muted_calendar_ids=$3, broadcast_threshold=$4, only_accepted=$5, hide_optional=$6, working_hours_only=$7`,
      [
        userId,
        JSON.stringify(updated.muted_titles),
        JSON.stringify(updated.muted_calendar_ids),
        updated.broadcast_threshold,
        updated.only_accepted,
        updated.hide_optional,
        updated.working_hours_only,
      ]
    );
    return updated;
  }

  async getIncludedCalendars(userId: string): Promise<IncludedCalendar[]> {
    const res = await this.pool.query("SELECT * FROM fc_included_calendars WHERE user_id = $1", [userId]);
    return res.rows.map(row => ({
      calendarId: row.calendar_id,
      include: row.include,
      summary: row.summary,
    }));
  }

  async saveIncludedCalendars(userId: string, calendars: IncludedCalendar[]): Promise<void> {
    await this.pool.query("DELETE FROM fc_included_calendars WHERE user_id = $1", [userId]);
    for (const cal of calendars) {
      await this.pool.query(
        `INSERT INTO fc_included_calendars (user_id, calendar_id, include, summary)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, calendar_id) DO UPDATE SET include=$3, summary=$4`,
        [userId, cal.calendarId, cal.include, cal.summary]
      );
    }
  }

  async getRoster(): Promise<RosterPerson[]> {
    const res = await this.pool.query("SELECT * FROM fc_roster");
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      timezone: r.timezone,
      role: r.role as "manager" | "team",
      segments: JSON.parse(r.segments),
    }));
  }

  async addRosterPerson(person: Omit<RosterPerson, "id">): Promise<RosterPerson> {
    const id = "roster-" + Math.random().toString(36).substring(2, 11);
    await this.pool.query(
      "INSERT INTO fc_roster (id, name, email, timezone, role, segments) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, person.name, person.email, person.timezone, person.role, JSON.stringify(person.segments)]
    );
    return { ...person, id };
  }

  async updateRosterPerson(id: string, updated: Partial<RosterPerson>): Promise<void> {
    const roster = await this.getRoster();
    const existing = roster.find(p => p.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updated };
    await this.pool.query(
      "UPDATE fc_roster SET name=$1, email=$2, timezone=$3, role=$4, segments=$5 WHERE id=$6",
      [merged.name, merged.email, merged.timezone, merged.role, JSON.stringify(merged.segments), id]
    );
  }

  async deleteRosterPerson(id: string): Promise<void> {
    await this.pool.query("DELETE FROM fc_roster WHERE id = $1", [id]);
  }
}

// Instantiate storage based on the environment variables
const dbBackend = process.env.DB_BACKEND || "file";
let activeStorage: Storage;

if (dbBackend === "postgres") {
  activeStorage = new PostgresStorage();
} else {
  activeStorage = new FileStorage();
}

export function initStorage(): Promise<void> {
  if (dbBackend === "postgres") {
    return (activeStorage as PostgresStorage).init();
  }
  return Promise.resolve();
}

// Wrapper exports that match the original synchronous wrapper but return Promises
export async function getUser(id: string): Promise<User | undefined> {
  return activeStorage.getUser(id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return activeStorage.getUserByEmail(email);
}

export async function saveUser(user: User): Promise<void> {
  return activeStorage.saveUser(user);
}

export async function getWorkHours(userId: string): Promise<WorkHours> {
  return activeStorage.getWorkHours(userId);
}

export async function saveWorkHours(userId: string, segments: [number, number][]): Promise<void> {
  return activeStorage.saveWorkHours(userId, segments);
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  return activeStorage.getPreferences(userId);
}

export async function savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  return activeStorage.savePreferences(userId, prefs);
}

export async function getIncludedCalendars(userId: string): Promise<IncludedCalendar[]> {
  return activeStorage.getIncludedCalendars(userId);
}

export async function saveIncludedCalendars(userId: string, calendars: IncludedCalendar[]): Promise<void> {
  return activeStorage.saveIncludedCalendars(userId, calendars);
}

export async function getRoster(): Promise<RosterPerson[]> {
  return activeStorage.getRoster();
}

export async function addRosterPerson(person: Omit<RosterPerson, "id">): Promise<RosterPerson> {
  return activeStorage.addRosterPerson(person);
}

export async function updateRosterPerson(id: string, updated: Partial<RosterPerson>): Promise<void> {
  return activeStorage.updateRosterPerson(id, updated);
}

export async function deleteRosterPerson(id: string): Promise<void> {
  return activeStorage.deleteRosterPerson(id);
}
