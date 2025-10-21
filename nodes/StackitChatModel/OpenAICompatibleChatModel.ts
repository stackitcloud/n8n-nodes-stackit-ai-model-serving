import { type IHttpRequestOptions } from 'n8n-workflow';

export type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool' | 'function'; content: string };

interface ChatModelLike {
    invoke(messages: ChatMessage[] | string, options?: unknown): Promise<{ content: string }>;
}

type ConstructorOptions = {
  model: string;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  maxRetries: number;
  timeout?: number; // ms
  request: (options: IHttpRequestOptions) => Promise<unknown>;
};

export class OpenAICompatibleChatModel implements ChatModelLike {
    private model: string;
    private temperature?: number;
    private topP?: number;
    private presencePenalty?: number;
    private frequencyPenalty?: number;
    private maxTokens?: number;
    private responseFormat?: 'text' | 'json_object';
    private maxRetries: number;
    private timeout?: number;
    private request: (options: IHttpRequestOptions) => Promise<unknown>;

    constructor(opts: ConstructorOptions) {
        this.model = opts.model;
        this.temperature = opts.temperature;
        this.topP = opts.topP;
        this.presencePenalty = opts.presencePenalty;
        this.frequencyPenalty = opts.frequencyPenalty;
        this.maxTokens = opts.maxTokens;
        this.responseFormat = opts.responseFormat;
        this.maxRetries = opts.maxRetries;
        this.timeout = opts.timeout;
        this.request = opts.request;
    }

    async invoke(messages: ChatMessage[] | string): Promise<{ content: string }> {
        const payload = this.makePayload(messages);
        let attempt = 0;
        while (true) {
            try {
                const json = (await this.request({
                    method: 'POST',
                    url: '/chat/completions',
                    body: payload,
                    timeout: this.timeout,
                })) as ChatCompletionResponse;
                const content = json.choices?.[0]?.message?.content ?? '';
                return { content };
            } catch (err) {
                if (++attempt > this.maxRetries) throw err;
            }
        }
    }

    private makePayload(messages: ChatMessage[] | string): ChatCompletionsRequest {
        const msgs: ChatMessage[] = Array.isArray(messages)
            ? messages
            : [{ role: 'user', content: messages }];
        const body: ChatCompletionsRequest = {
            model: this.model,
            messages: msgs,
        };
        if (this.temperature !== undefined) body.temperature = this.temperature;
        if (this.topP !== undefined) body.top_p = this.topP;
        if (this.presencePenalty !== undefined) body.presence_penalty = this.presencePenalty;
        if (this.frequencyPenalty !== undefined) body.frequency_penalty = this.frequencyPenalty;
        if (this.maxTokens !== undefined && this.maxTokens >= 0) body.max_tokens = this.maxTokens;
        if (this.responseFormat && this.responseFormat !== 'text')
            body.response_format = { type: 'json_object' };
        return body;
    }
}

type ChatCompletionResponse = {
    choices: Array<{
        message: { role: string; content: string };
    }>;
};

type ChatCompletionsRequest = {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
};
