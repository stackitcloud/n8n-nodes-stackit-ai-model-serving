# STACKIT Chat Model

This node exposes ChatCompletions-compatible large language models from STACKIT AI Model Serving for use in n8n.

- Credential: "STACKIT AI Model Serving API" (API key)
- API URL: Configurable in the credential (defaults to
  <https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1>)
- Output: AiLanguageModel (connect to Agents/Chains/Prompt nodes)

Notes:

- No LangChain dependency: You can connect this node directly to n8n AI nodes or your own logic. It also accepts common LangChain-like prompt shapes but does not require LangChain to be installed.
- Input normalization: Accepts strings, OpenAI-style message arrays, and objects like { input }, { messages }, { prompt }, and typical LangChain prompt values. The node normalizes these to OpenAI-compatible messages.
- JSON response mode: If you set Response Format to JSON, ensure your prompt contains the word "json" and instructs the model to return valid JSON.
- Error handling and traceability: Unknown errors are wrapped in NodeOperationError for readable failures, and all requests/responses are logged via addInputData/addOutputData so you can inspect them in the execution UI.

See the repository root documentation for details and usage tips: <https://github.com/stackitcloud/n8n-nodes-stackit-ai-model-serving#stackit-chat-model>
