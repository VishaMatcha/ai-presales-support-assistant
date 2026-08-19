export interface SupportRecord {
  instruction: string;
  response: string;
  category?: string;
  intent?: string;
  flags?: string;
}

// Replace this implementation to ingest a private help center, CMS, or another public dataset.
export interface DatasetLoader {
  readonly sourceName: string;
  load(limit: number): Promise<SupportRecord[]>;
}
