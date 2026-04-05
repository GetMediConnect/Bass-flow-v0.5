// BassFlow SDK — TypeScript type definitions

export interface BassFlowOptions {
  baseURL?: string;
  token?: string;
  timeout?: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  genre?: string;
  bio?: string;
  xp: number;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
}

export interface Track {
  id: number;
  user_id: number;
  title: string;
  genre: string;
  bpm?: number;
  key?: string;
  duration_sec?: number;
  audio_url?: string;
  cover_url?: string;
  tags?: string;
  plays: number;
  likes: number;
  created_at: string;
  username?: string;
}

export interface Mix {
  id: number;
  user_id: number;
  title: string;
  genre?: string;
  duration_sec?: number;
  tracklist?: string;
  audio_url?: string;
  cover_url?: string;
  plays: number;
  likes: number;
  created_at: string;
  username?: string;
}

export interface Event {
  id: number;
  title: string;
  venue: string;
  city: string;
  country?: string;
  event_date: string;
  ticket_url?: string;
  image_url?: string;
  lineup?: string;
  genre?: string;
}

export interface Comment {
  id: number;
  user_id: number;
  track_id: number;
  body: string;
  created_at: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedTracks {
  tracks: Track[];
  total: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
}

export interface PaginatedEvents {
  events: Event[];
  total: number;
}

export interface PaginatedMixes {
  mixes: Mix[];
  total: number;
}

export declare class BassFlowError extends Error {
  code: string;
  status: number;
  data: Record<string, unknown>;
}

export declare class BassFlowSDK {
  constructor(options?: BassFlowOptions);
  auth: AuthModule;
  tracks: TracksModule;
  users: UsersModule;
  events: EventsModule;
  mixes: MixesModule;
  version: string;
  setToken(token: string): this;
  clearToken(): this;
  ping(): Promise<boolean>;
}

export declare class AuthModule {
  register(opts: { username: string; email: string; password: string; genre?: string }): Promise<AuthResponse>;
  login(opts: { email: string; password: string }): Promise<AuthResponse>;
  me(): Promise<User>;
  logout(): void;
}

export declare class TracksModule {
  list(opts?: { genre?: string; q?: string; sort?: string; limit?: number; offset?: number }): Promise<PaginatedTracks>;
  get(id: number | string): Promise<Track>;
  create(track: Omit<Track, 'id' | 'user_id' | 'plays' | 'likes' | 'created_at'>): Promise<Track>;
  update(id: number | string, fields: Partial<Track>): Promise<Track>;
  delete(id: number | string): Promise<{ success: boolean }>;
  like(id: number | string): Promise<{ liked: boolean; likes: number }>;
  comments(id: number | string): Promise<Comment[]>;
  comment(id: number | string, body: string): Promise<Comment>;
  play(id: number | string): Promise<{ plays: number }>;
}

export declare class UsersModule {
  list(opts?: { limit?: number; offset?: number; sort?: string }): Promise<PaginatedUsers>;
  get(id: number | string): Promise<User>;
  follow(id: number | string): Promise<{ following: boolean }>;
  update(fields: Partial<User>): Promise<User>;
}

export declare class EventsModule {
  list(opts?: { limit?: number; offset?: number; upcoming?: boolean }): Promise<PaginatedEvents>;
  get(id: number | string): Promise<Event>;
  create(event: Omit<Event, 'id'>): Promise<Event>;
  update(id: number | string, fields: Partial<Event>): Promise<Event>;
  delete(id: number | string): Promise<{ success: boolean }>;
}

export declare class MixesModule {
  list(opts?: { genre?: string; limit?: number; offset?: number }): Promise<PaginatedMixes>;
  get(id: number | string): Promise<Mix>;
  create(mix: Omit<Mix, 'id' | 'user_id' | 'plays' | 'likes' | 'created_at'>): Promise<Mix>;
  update(id: number | string, fields: Partial<Mix>): Promise<Mix>;
  delete(id: number | string): Promise<{ success: boolean }>;
}
