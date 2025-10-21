# STACKIT Embeddings

This node generates vector embeddings using STACKIT AI Model Serving’s embeddings models.

- Credential: "STACKIT AI Model Serving API" (API key)
- API URL: Configurable in the credential (defaults to
  <https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1>)
- Output: AiEmbedding (connect to vector stores/RAG flows)

Notes:

- No LangChain dependency: Use directly with n8n AI or custom logic. The node provides an embeddings-like interface and can be used wherever an embeddings object is expected.
- Batching and timeout: Inputs are batched for efficient calls. Timeout values < 1000 are treated as seconds and converted to milliseconds.
- Error handling and traceability: Unknown errors are wrapped in NodeOperationError for readable failures, and all requests/responses are logged via addInputData/addOutputData so each call is traceable in the UI.

See the repository root documentation for details and usage tips: <https://github.com/stackitcloud/n8n-nodes-stackit-ai-model-serving#stackit-embeddings>
