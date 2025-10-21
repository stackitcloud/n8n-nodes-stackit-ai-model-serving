import {
    NodeConnectionType,
    NodeError,
    NodeOperationError,
    type IHttpRequestOptions,
    type INodeType,
    type INodeTypeDescription,
    type ISupplyDataFunctions,
    type JsonObject,
    type SupplyData,
} from 'n8n-workflow';

import { OpenAICompatibleChatModel, type ChatMessage } from './OpenAICompatibleChatModel';


export class StackitChatModel implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'STACKIT Chat Model',

		name: 'stackitChatModel',
		icon: { light: 'file:../../icons/logo-light.svg', dark: 'file:../../icons/logo-dark.svg' },
		group: ['transform'],
		version: 1, 
		description: 'Provides access to the STACKIT Chat Model API.',
		defaults: {
			name: 'STACKIT Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/stackitcloud/n8n-nodes-stackit-ai-model-serving#stackit-chat-model',
					},
				],
			},
		},

		inputs: [],

		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'stackitAiModelServingApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			// Use API URL from credentials at runtime (falls back to default via credentials config)
			baseURL: '={{$credentials.apiUrl}}',
		},
		properties: [
			{
				displayName:
					'If using JSON response format, you must include word "json" in the prompt in your chain or agent.',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						'/options.responseFormat': ['json_object'],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				description:
					'The model which will generate the completion. <a href="https://beta.openai.com/docs/models/overview">Learn more</a>.',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '/models',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
									{
										type: 'filter',
										properties: {
								            // show only LM models
											pass: `={{ !$responseItem.id.includes('intfloat') }}`,
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.id}}',
											value: '={{$responseItem.id}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
				},
				default: '',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to add',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							"Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
						type: 'number',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						default: 2,
						description: 'Maximum number of retries to attempt',
						type: 'number',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: -1,
						description:
							'The maximum number of tokens to generate in the completion. Most models have a max context length of 4096 tokens.',
						type: 'number',
						typeOptions: {
							maxValue: 4096,
						},
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							"Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
						type: 'number',
					},
					{
						displayName: 'Response Format',
						name: 'responseFormat',
						default: 'text',
						type: 'options',
						options: [
							{
								name: 'Text',
								value: 'text',
								description: 'Regular text response',
							},
							{
								name: 'JSON',
								value: 'json_object',
								description:
									'Enables JSON mode, which should guarantee the message the model generates is valid JSON',
							},
						],
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
						type: 'number',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						default: 60000,
						description: 'Maximum amount of time a request is allowed to take in milliseconds',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const modelName = this.getNodeParameter('model', itemIndex) as string;

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			frequencyPenalty?: number;
			maxTokens?: number;
			maxRetries?: number;
			timeout?: number;
			presencePenalty?: number;
			temperature?: number;
			topP?: number;
			responseFormat?: 'text' | 'json_object';
		};

		// Normalize timeouts: accept seconds if user provided a small number (<1000)
		let timeout = options.timeout;
		if (timeout === -1 as unknown as number) timeout = undefined;
		else if (typeof timeout === 'number' && timeout > 0 && timeout < 1000) timeout = timeout * 1000;

		const request = (opts: IHttpRequestOptions) =>
			this.helpers.httpRequestWithAuthentication.call(this, 'stackitAiModelServingApi', opts);

		const model = new OpenAICompatibleChatModel({
			model: modelName,
			temperature: options.temperature,
			topP: options.topP,
			presencePenalty: options.presencePenalty,
			frequencyPenalty: options.frequencyPenalty,
			maxTokens: options.maxTokens,
			responseFormat: options.responseFormat,
			maxRetries: options.maxRetries ?? 2,
			timeout: timeout ?? 60000,
			request,
		});

		// Provide a plain async function to satisfy Basic LLM Chain expectations (Runnable/function/object)
		const llm = async (input: unknown): Promise<string> => {
			// Normalize input into Chat messages
			let messages: ChatMessage[] = [];

			// Type guards and helpers
			const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
			const getString = (r: Record<string, unknown>, key: string): string | undefined =>
				typeof r[key] === 'string' ? (r[key] as string) : undefined;
			const getArray = (r: Record<string, unknown>, key: string): unknown[] | undefined =>
				Array.isArray(r[key]) ? (r[key] as unknown[]) : undefined;

			// Helper to coerce LangChain ChatPromptValue messages to OpenAI messages
			const coerceLcMessage = (m: unknown): ChatMessage | null => {
				if (!isRecord(m)) return null;
				const roleMap: Record<string, ChatMessage['role']> = {
					human: 'user',
					system: 'system',
					ai: 'assistant',
				};
				let role: ChatMessage['role'] = 'user';
				const directRole = getString(m, 'role');
				const typeRole = getString(m, 'type');
				if (directRole) role = (directRole as ChatMessage['role']) || 'user';
				else if (typeRole) role = roleMap[typeRole] ?? 'user';
				let content = '';
				const directContent = getString(m, 'content');
				if (directContent) content = directContent;
				else {
					const contentArr = getArray(m, 'content');
					if (contentArr) {
						content = contentArr
							.map((p) => (isRecord(p) && typeof p.text === 'string' ? (p.text as string) : ''))
							.filter((t) => t)
							.join('\n');
					}
				}
				if (!content) return null;
				return { role, content };
			};

			if (typeof input === 'string') {
				messages = [{ role: 'user', content: input }];
			} else if (Array.isArray(input)) {
				messages = input as ChatMessage[];
			} else if (input && typeof input === 'object') {
				const obj = input as Record<string, unknown>;
				// n8n AI often passes { input: string }
				if (typeof obj.input === 'string') {
					messages = [{ role: 'user', content: obj.input }];
				} else if (Array.isArray(obj.messages)) {
					messages = obj.messages as ChatMessage[];
				} else if (isRecord(obj.kwargs) && typeof obj.kwargs.value === 'string') {
					// LangChain StringPromptValue
					messages = [{ role: 'user', content: obj.kwargs.value as string }];
				} else if (isRecord(obj.kwargs) && Array.isArray(obj.kwargs.messages)) {
					// LangChain ChatPromptValue
					messages = (obj.kwargs.messages as unknown[])
						.map((m) => coerceLcMessage(m))
						.filter((m): m is ChatMessage => !!m);
				} else if (typeof obj.value === 'string') {
					messages = [{ role: 'user', content: obj.value }];
				} else if (typeof obj.prompt === 'string') {
					messages = [{ role: 'user', content: obj.prompt }];
				} else {
					messages = [{ role: 'user', content: JSON.stringify(obj) }];
				}
			} else {
				messages = [{ role: 'user', content: '' }];
			}

			// Log to n8n UI
			const { index } = this.addInputData(NodeConnectionType.AiLanguageModel, [[{ json: { messages } }]]);

			try {
				const { content } = await model.invoke(messages);
				this.addOutputData(NodeConnectionType.AiLanguageModel, index, [[{ json: { response: content } }]]);
				return content;
			} catch (error) {
				if (error instanceof NodeError) {
					this.addOutputData(NodeConnectionType.AiLanguageModel, index, error);
					throw error;
				}
				const wrapped = new NodeOperationError(this.getNode(), error as JsonObject);
				this.addOutputData(NodeConnectionType.AiLanguageModel, index, wrapped);
				throw error as Error;
			}
		};

		return { response: llm };
	}
}
