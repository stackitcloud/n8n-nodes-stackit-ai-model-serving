# Changelog

## 1.2.0 - 2026-04-13

- Fix tool calling support in the STACKIT Chat Model node (#1).
- Replace internal HTTP-based chat client with LangChain's `ChatOpenAI` configured against STACKIT's OpenAI-compatible endpoint.
- The node now returns a proper LangChain `BaseChatModel` instance, enabling `bindTools()` and full tool call response handling required by n8n's Tools Agent.
- Add `@langchain/openai` as a peer dependency (already bundled with n8n).

## 1.0.1 - 2025-10-21

- Remove LangChain dependencies and restricted imports.
- Implement internal HTTP-based clients for Chat and Embeddings using n8n request helper.
- Add lightweight logging wrappers to surface inputs/outputs in the n8n UI.

