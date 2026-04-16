# STACKIT Chat Model

This node exposes ChatCompletions-compatible large language models from STACKIT AI Model Serving for use in n8n.

- Credential: "STACKIT AI Model Serving API" (API key + API URL)
- API URL: Configurable in the credential (defaults to
  <https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1>)
- Output: AiLanguageModel (connect to Tools Agent, Basic LLM Chain, AI Chain, etc.)

Implementation:

- Powered by LangChain's `ChatOpenAI` configured against STACKIT's OpenAI-compatible endpoint. This provides `bindTools()` and full tool call response handling, making the node compatible with n8n's Tools Agent and any workflow that requires tool calling support.
- The `@langchain/openai` package is used as a peer dependency — it is already bundled with n8n so no additional install is needed.

Notes:

- JSON response mode: If you set Response Format to JSON, ensure your prompt instructs the model to return valid JSON.
- Error handling: Errors are surfaced as NodeOperationError for readable failures in the n8n UI.

See the repository root documentation for details and usage tips: <https://github.com/stackitcloud/n8n-nodes-stackit-ai-model-serving#stackit-chat-model>
