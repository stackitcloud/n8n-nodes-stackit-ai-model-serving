import { OpenAIEmbeddings } from '@langchain/openai';
import {
    NodeConnectionType,
    type INodeType,
    type INodeTypeDescription,
    type ISupplyDataFunctions,
    type SupplyData,
} from 'n8n-workflow';
import type { ClientOptions } from 'openai';

import { STACKIT_API_BASE_URL } from '../../credentials/StackitAiModelServingApi.credentials';
import { EmbeddingsLogWrapper } from './EmbeddingsLogWrapper';


export class StackitEmbeddings implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'STACKIT Embeddings',

		name: 'stackitEmbeddings',
		icon: { light: 'file:../../icons/logo-light.svg', dark: 'file:../../icons/logo-dark.svg' },
		group: ['transform'],
		version: 1, 
		description: 'Provides access to the STACKIT Embeddings API.',
		defaults: {
			name: 'STACKIT Embeddings',
		},
	    codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Embeddings'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://stackit-solutions.git.onstackit.cloud/andreas.klos/n8n-nodes-stackit-ai-model-serving#stackit-embeddings',
					},
				],
			},
		},

		inputs: [],

		outputs: [NodeConnectionType.AiEmbedding],
		outputNames: ['Embeddings'],
		credentials: [
			{
				name: 'stackitAiModelServingApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: STACKIT_API_BASE_URL,
		},
		properties: [
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
								            // show only embeddings
											pass: `={{ $responseItem.id.includes('intfloat') }}`,
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
						displayName: 'Batch Size',
						name: 'batchSize',
						default: 256,
						typeOptions: { maxValue: 2048 },
						description: 'Maximum number of documents to send in each request',
						type: 'number',
					},
					{
						displayName: 'Strip New Lines',
						name: 'stripNewLines',
						default: true,
						description: 'Whether to strip new lines from the input text',
						type: 'boolean',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						default: -1,
						description:
							'Maximum amount of time a request is allowed to take in seconds. Set to -1 for no timeout.',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('stackitAiModelServingApi');

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			baseURL?: string;
			batchSize?: number;
			stripNewLines?: boolean;
			timeout?: number;
		};

		if (options.timeout === -1) {
			options.timeout = undefined;
		} else if (typeof options.timeout === 'number' && options.timeout > 0 && options.timeout < 1000) {
			// Accept seconds and convert to ms if user provided a small number (<1000)
			options.timeout = options.timeout * 1000;
		}

		const configuration: ClientOptions = {};

		configuration.baseURL = STACKIT_API_BASE_URL;

		const embeddings = new OpenAIEmbeddings({
			model: this.getNodeParameter('model', itemIndex, 'intfloat/e5-mistral-7b-instruct') as string,
			apiKey: credentials.apiKey as string,
			...options,
			configuration,
		});

		// Prefer a log wrapper for embeddings to ensure UI logging regardless of callback propagation
		const wrapped = new EmbeddingsLogWrapper(embeddings, this, NodeConnectionType.AiEmbedding);

		return {
			response: wrapped,
		};
	}
}
