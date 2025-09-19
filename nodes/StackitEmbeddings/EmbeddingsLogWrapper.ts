import type { IDataObject, ISupplyDataFunctions, JsonObject } from 'n8n-workflow';
import { NodeConnectionType, NodeError, NodeOperationError } from 'n8n-workflow';

// Minimal interface for LangChain embeddings we care about
export interface EmbeddingsLike {
  embedDocuments(documents: string[], options?: unknown): Promise<number[][]>;
  embedQuery(document: string, options?: unknown): Promise<number[]>;
}

// Wraps an embeddings instance to surface inputs/outputs/errors to the n8n UI
export class EmbeddingsLogWrapper implements EmbeddingsLike {
  constructor(
    private inner: EmbeddingsLike,
    private executionFunctions: ISupplyDataFunctions,
    private connectionType: NodeConnectionType = NodeConnectionType.AiEmbedding,
  ) {}

  async embedDocuments(documents: string[], options?: unknown): Promise<number[][]> {
    const payload: IDataObject = {
      inputs: documents,
      ...(options !== undefined ? { options: (options as unknown as IDataObject) } : {}),
    };
    const { index } = this.executionFunctions.addInputData(this.connectionType, [[{ json: payload }]]);

    try {
      const embeddings = await this.inner.embedDocuments(documents, options);
      this.executionFunctions.addOutputData(
        this.connectionType,
        index,
        [[{ json: { response: { embeddings } } }]],
      );
      return embeddings;
    } catch (error) {
      this.handleError(index, error);
      throw error;
    }
  }

  async embedQuery(document: string, options?: unknown): Promise<number[]> {
    const payload: IDataObject = {
      inputs: [document],
      ...(options !== undefined ? { options: (options as unknown as IDataObject) } : {}),
    };
    const { index } = this.executionFunctions.addInputData(this.connectionType, [[{ json: payload }]]);

    try {
      const embedding = await this.inner.embedQuery(document, options);
      this.executionFunctions.addOutputData(
        this.connectionType,
        index,
        [[{ json: { response: { embeddings: embedding } } }]],
      );
      return embedding;
    } catch (error) {
      this.handleError(index, error);
      throw error;
    }
  }

  private handleError(index: number, error: unknown) {
    if (error instanceof NodeError) {
      this.executionFunctions.addOutputData(this.connectionType, index, error);
      return;
    }

    this.executionFunctions.addOutputData(
      this.connectionType,
      index,
      new NodeOperationError(this.executionFunctions.getNode(), error as JsonObject),
    );
  }
}
