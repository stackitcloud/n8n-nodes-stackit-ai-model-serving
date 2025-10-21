import type { IDataObject, ISupplyDataFunctions, JsonObject } from 'n8n-workflow';
import { NodeConnectionType, NodeError, NodeOperationError } from 'n8n-workflow';

type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool' | 'function'; content: string };

interface ChatModelLike {
  invoke(messages: ChatMessage[] | string, options?: unknown): Promise<{ content: string }>;
}

export class ChatLogWrapper implements ChatModelLike {
  constructor(
    private inner: ChatModelLike,
    private executionFunctions: ISupplyDataFunctions,
    private connectionType: NodeConnectionType = NodeConnectionType.AiLanguageModel,
  ) {}

  async invoke(messages: ChatMessage[] | string): Promise<{ content: string }> {
    const payload: IDataObject = Array.isArray(messages) ? { messages } : { messages: [messages] };
    const { index } = this.executionFunctions.addInputData(this.connectionType, [[{ json: payload }]]);

    try {
      const response = await this.inner.invoke(messages);
      this.executionFunctions.addOutputData(
        this.connectionType,
        index,
        [[{ json: { response } }]],
      );
      return response;
    } catch (error) {
      if (error instanceof NodeError) {
        this.executionFunctions.addOutputData(this.connectionType, index, error);
        throw error;
      }
      const wrapped = new NodeOperationError(this.executionFunctions.getNode(), error as JsonObject);
      this.executionFunctions.addOutputData(this.connectionType, index, wrapped);
      throw error;
    }
  }
}
