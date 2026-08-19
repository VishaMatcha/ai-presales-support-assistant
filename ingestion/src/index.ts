import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { QdrantClient } from '@qdrant/js-client-rest';
import { BitextDatasetLoader } from './datasets/bitext.loader.js';

const limit = Number(process.env.DATASET_LIMIT ?? 2_000);
const batchSize = Number(process.env.EMBED_BATCH_SIZE ?? 32);
const collection = process.env.QDRANT_COLLECTION ?? 'bitext_support';
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL ?? 'http://localhost:6333' });
const embeddings = new OllamaEmbeddings({ baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434', model: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text' });
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 900, chunkOverlap: 90 });

async function waitForQdrant() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await qdrant.getCollections();
      return;
    } catch {
      if (attempt === 30) throw new Error('Qdrant did not become ready in time.');
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

async function main() {
  await waitForQdrant();
  const loader = new BitextDatasetLoader();
  const records = await loader.load(limit);
  if (records.length === 0) throw new Error('The dataset loader returned no instruction/response pairs.');
  console.log(`Loaded ${records.length} rows from ${loader.sourceName}`);

  const chunks: Array<{ text: string; record: (typeof records)[number] }> = [];
  for (const record of records) {
    const text = `Customer question: ${record.instruction}\nSupport answer: ${record.response}`;
    for (const chunk of await splitter.splitText(text)) chunks.push({ text: chunk, record });
  }

  const probe = await embeddings.embedQuery(chunks[0].text);
  const exists = await qdrant.collectionExists(collection);
  if (exists.exists) await qdrant.deleteCollection(collection);
  await qdrant.createCollection(collection, { vectors: { size: probe.length, distance: 'Cosine' } });

  let pointId = 0;
  for (let start = 0; start < chunks.length; start += batchSize) {
    const batch = chunks.slice(start, start + batchSize);
    const vectors = start === 0
      ? [probe, ...(await embeddings.embedDocuments(batch.slice(1).map((item) => item.text)))]
      : await embeddings.embedDocuments(batch.map((item) => item.text));
    await qdrant.upsert(collection, {
      wait: true,
      points: batch.map((item, index) => ({
        id: pointId++,
        vector: vectors[index],
        payload: {
          text: item.text,
          instruction: item.record.instruction,
          response: item.record.response,
          category: item.record.category,
          intent: item.record.intent,
          flags: item.record.flags,
          source: loader.sourceName,
        },
      })),
    });
    console.log(`Embedded ${Math.min(start + batch.length, chunks.length)}/${chunks.length} chunks`);
  }
  console.log(`Ready: ${collection} contains ${chunks.length} chunks.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
