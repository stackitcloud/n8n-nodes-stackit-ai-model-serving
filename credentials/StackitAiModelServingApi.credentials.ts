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

	documentationUrl = 'https://github.com/stackitcloud/n8n-nodes-stackit-ai-model-serving#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
        {
            displayName: 'API URL',
            name: 'apiUrl',
            type: 'string',
            required: false,
            default: STACKIT_API_BASE_URL,
        }
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl}}',
			url: '/models',
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const baseURL = (credentials.apiUrl as string) || STACKIT_API_BASE_URL;
		requestOptions.baseURL = baseURL;

		requestOptions.headers = {
			...(requestOptions.headers ?? {}),
			Authorization: 'Bearer ' + credentials.apiKey,
		};
		return requestOptions;
	}
}
