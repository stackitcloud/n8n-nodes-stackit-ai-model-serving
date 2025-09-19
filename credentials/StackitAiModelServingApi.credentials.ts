import type {
    ICredentialDataDecryptedObject,
    ICredentialTestRequest,
    ICredentialType,
    IHttpRequestOptions,
    INodeProperties,
} from 'n8n-workflow';

export const STACKIT_API_BASE_URL = 'https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1';

export class StackitAiModelServingApi implements ICredentialType {
	name = 'stackitAiModelServingApi';

	displayName = 'Stackit AI Model Serving API';

	documentationUrl = 'https://stackit-solutions.git.onstackit.cloud/andreas.klos/n8n-nodes-stackit-ai-model-serving#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: STACKIT_API_BASE_URL,
			url: '/models',
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.headers = {
			Authorization: 'Bearer ' + credentials.apiKey,
		};
		return requestOptions;
	}
}
