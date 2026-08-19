import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import type { DatasetLoader, SupportRecord } from './types.js';

const DEFAULT_URL = 'https://huggingface.co/datasets/bitext/Bitext-customer-support-llm-chatbot-training-dataset/resolve/main/Bitext_Sample_Customer_Support_Training_Dataset_27K_responses-v11.csv';

export class BitextDatasetLoader implements DatasetLoader {
  readonly sourceName = 'bitext/Bitext-customer-support-llm-chatbot-training-dataset';

  async load(limit: number): Promise<SupportRecord[]> {
    const localPath = process.env.DATASET_PATH;
    const csv = localPath ? await readFile(localPath, 'utf8') : await this.download(process.env.DATASET_URL ?? DEFAULT_URL);
    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    return rows
      .filter((row) => row.instruction && row.response)
      .slice(0, limit)
      .map((row) => ({ instruction: row.instruction, response: row.response, category: row.category, intent: row.intent, flags: row.flags ?? row.tags }));
  }

  private async download(url: string): Promise<string> {
    console.log(`Downloading Bitext data from ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Dataset download failed: ${response.status} ${response.statusText}`);
    return response.text();
  }
}
