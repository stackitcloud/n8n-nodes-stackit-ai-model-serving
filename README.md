# STACKIT AI Model Serving nodes for n8n

n8n community nodes that connect to STACKIT AI Model Serving’s OpenAI-compatible API. Includes:

- STACKIT Chat Model — Chat-completions compatible LLM node.
- STACKIT Embeddings — Text embeddings generation node.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [STACKIT Chat Model](#stackit-chat-model)
- [STACKIT Embeddings](#stackit-embeddings)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the official guide to install community nodes: [n8n Community Nodes Installation](https://docs.n8n.io/integrations/community-nodes/installation/)

Once installed, search for “STACKIT Chat Model” or “STACKIT Embeddings” in the node panel.

## Credentials

These nodes use a single credential: “STACKIT AI Model Serving API”.

What you need:

- API Key from your STACKIT AI Model Serving project
- API URL (optional): defaults to <https://api.openai-compat.model-serving.eu01.onstackit.cloud/v1>

How it works:

- Set the API Key and (optionally) API URL in the credential "STACKIT AI Model Serving API".
- All node requests use the credential’s API URL. If not set, the default endpoint above is used.
- The Model picker fetches from `${API_URL}/models` using your credential.

Notes:

- These nodes are compatible with OpenAI-style models and endpoints provided by STACKIT

## STACKIT Chat Model

Use this node to obtain a ChatCompletions-capable model as an AI Model output for n8n’s AI features or LangChain-based chains.

Key options:

- Model: dynamically loaded from your STACKIT project (non-embedding models)
- Temperature, Top P, Penalties, Max tokens, Retries, Timeout
- Response format: text or JSON (when using JSON mode, ensure your prompts instruct the model to return valid JSON)

Typical usage:

1. Add “STACKIT Chat Model” to the canvas
2. Configure the node with your desired parameters (API-Key, Model and Options)
3. Connect to AI nodes (e.g., AI Agent, AI Chain)

## STACKIT Embeddings

Use this node to generate vector embeddings from text.

Key options:

- Model: dynamically loaded embeddings models (intfloat/* models)
- Dimensions: choose target dimensionality if supported
- Batch size and timeout controls
- Strip new lines option for cleaner inputs

Typical usage:

1. Add “STACKIT Embeddings” to the canvas (AI > Embeddings)
2. Configure the node with your desired parameters (API-Key, Model and Options)
3. Connect the output to vector stores, RAG flows, or custom logic

## Compatibility

Compatible with n8n@1.60.0 or later.

## Resources

- Product: <https://www.stackit.de/en/product/stackit-ai-model-serving>
- n8n Community Nodes: <https://docs.n8n.io/integrations/#community-nodes>
- OpenAI compatibility: <https://platform.openai.com/docs/api-reference>
- GitHub repo: <https://stackit-solutions.git.onstackit.cloud/andreas.klos/n8n-nodes-stackit-ai-model-serving>
