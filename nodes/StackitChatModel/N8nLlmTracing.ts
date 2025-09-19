import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { Serialized } from '@langchain/core/load/serializable';
import type { LLMResult } from '@langchain/core/outputs';
import type { IDataObject, ISupplyDataFunctions, JsonObject } from 'n8n-workflow';
import { NodeConnectionType, NodeError, NodeOperationError } from 'n8n-workflow';

type RunDetail = {
  index: number;
  messages: string[] | string;
  options: unknown;
};

// Minimal tracing handler to surface model input/output and errors to the n8n UI
export class N8nLlmTracing extends BaseCallbackHandler {
  name = 'n8nLlmTracing';
  // Ensure LangChain awaits our hooks so UI logs stay ordered
  awaitHandlers = true;
  connectionType: NodeConnectionType = NodeConnectionType.AiLanguageModel;

  // Associate LangChain runId -> n8n run details
  runsMap: Record<string, RunDetail> = {};

  constructor(private executionFunctions: ISupplyDataFunctions, connectionType?: NodeConnectionType) {
    super();
    if (connectionType) this.connectionType = connectionType;
  }

  async handleLLMStart(llm: Serialized, prompts: string[], runId: string) {
    type PossiblyConstructorSerialized = Serialized & { type?: string; kwargs?: unknown };
    const s = llm as PossiblyConstructorSerialized;
    const options = s.type === 'constructor' ? s.kwargs : llm;
    const { index } = this.executionFunctions.addInputData(this.connectionType, [
      [
        {
          json: {
            messages: prompts,
            options,
          },
        },
      ],
    ]);

    this.runsMap[runId] = {
      index,
      options,
      messages: prompts,
    };
  }

  async handleLLMEnd(output: LLMResult, runId: string) {
    const runDetails = this.runsMap[runId] ?? { index: Object.keys(this.runsMap).length, messages: [], options: {} };

    this.executionFunctions.addOutputData(
      this.connectionType,
      runDetails.index,
      [[{ json: { response: { generations: output.generations } } }]],
    );
  }

  async handleLLMError(error: IDataObject | Error, runId: string) {
    const runDetails = this.runsMap[runId] ?? { index: Object.keys(this.runsMap).length, messages: [], options: {} };

    if (error instanceof NodeError) {
      this.executionFunctions.addOutputData(this.connectionType, runDetails.index, error);
      return;
    }

    this.executionFunctions.addOutputData(
      this.connectionType,
      runDetails.index,
      new NodeOperationError(this.executionFunctions.getNode(), error as JsonObject),
    );
  }
}
