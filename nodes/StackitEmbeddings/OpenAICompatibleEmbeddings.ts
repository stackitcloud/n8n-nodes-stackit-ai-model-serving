import type { IHttpRequestOptions } from 'n8n-workflow';
import type { EmbeddingsLike } from './EmbeddingsLogWrapper';

type ConstructorOptions = {
  model: string;
  batchSize?: number;
  stripNewLines?: boolean;
  timeout?: number; // ms
  request: (options: IHttpRequestOptions) => Promise<unknown>;
};

export class OpenAICompatibleEmbeddings implements EmbeddingsLike {
  private model: string;
  private batchSize: number;
  private stripNewLines: boolean;
  private timeout?: number;
  private request: (options: IHttpRequestOptions) => Promise<unknown>;

  constructor(opts: ConstructorOptions) {
    this.model = opts.model;
    this.batchSize = Math.max(1, opts.batchSize ?? 256);
    this.stripNewLines = opts.stripNewLines ?? true;
    this.timeout = opts.timeout;
    this.request = opts.request;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const docs = this.preprocessInputs(documents);
    const batches = this.chunk(docs, this.batchSize);
    const results: number[][] = [];
    for (const batch of batches) {
      const res = await this.createEmbeddings(batch);
      results.push(...res);
    }
    return results;
  }

  async embedQuery(document: string): Promise<number[]> {
    const [embedding] = await this.createEmbeddings([this.preprocessInput(document)]);
    return embedding;
  }

  private preprocessInput(text: string): string {
    return this.stripNewLines ? text.replace(/\n/g, ' ') : text;
  }

  private preprocessInputs(inputs: string[]): string[] {
    return inputs.map((t) => this.preprocessInput(t));
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private async createEmbeddings(input: string[]): Promise<number[][]> {
    const json = (await this.request({
      method: 'POST',
      url: '/embeddings',
      body: { model: this.model, input },
      timeout: this.timeout,
    })) as { data: Array<{ embedding: number[] }> };
    return json.data.map((d) => d.embedding);
  }
}
