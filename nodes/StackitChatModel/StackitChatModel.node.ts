import { ChatOpenAI, type ClientOptions } from '@langchain/openai';
import {
    NodeConnectionType,
    type INodeType,
    type INodeTypeDescription,
    type ISupplyDataFunctions,
    type SupplyData,
} from 'n8n-workflow';

import { STACKIT_API_BASE_URL } from '../../credentials/StackitAiModelServingApi.credentials';
import { N8nLlmTracing } from './N8nLlmTracing';


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
						url: 'https://stackit-solutions.git.onstackit.cloud/andreas.klos/n8n-nodes-stackit-ai-model-serving#stackit-chat-model',
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
		const credentials = await this.getCredentials('stackitAiModelServingApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			frequencyPenalty?: number;
			maxTokens?: number;
			maxRetries: number;
			timeout: number;
			presencePenalty?: number;
			temperature?: number;
			topP?: number;
			responseFormat?: 'text' | 'json_object';
		};

		const configuration: ClientOptions = {};
		// Prefer user-configured API URL from credentials, fallback to default
		configuration.baseURL = (credentials.apiUrl as string) || STACKIT_API_BASE_URL;

		// Extra options to send to the OpenAI compatible API, that are not directly supported by LangChain
		const modelKwargs: {
			response_format?: object;
		} = {};
		if (options.responseFormat) modelKwargs.response_format = { type: options.responseFormat };

		const model = new ChatOpenAI({
			apiKey: credentials.apiKey as string,
			model: modelName,
			...options,
			timeout: options.timeout ?? 60000,
			maxRetries: options.maxRetries ?? 2,
			configuration,
			callbacks: [new N8nLlmTracing(this)],
			modelKwargs,
		});

		return {
			response: model,
		};
	}
}
