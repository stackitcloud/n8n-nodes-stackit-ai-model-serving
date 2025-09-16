import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import { chatFields, chatOperations } from './ChatDescription';


export class StackitChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'STACKIT Chat Model',
		name: 'stackitChatModel',
		icon: { light: 'file:../../icons/logo.svg', dark: 'file:../../icons/logo.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Provides access to the STACKIT Chat Model API',
		defaults: {
			name: 'STACKIT Chat Model',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'stackitAiModelServingApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL:
				'={{ $credentials.url?.split("/").slice(0,-1).join("/") ?? "https://api.openai-compat.model-serving.eu01.onstackit.cloud" }}',
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					}
				],
				default: 'chat',
			},

			...chatOperations,
			...chatFields,
		],
	};
}
