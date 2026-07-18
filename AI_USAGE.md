# AI Usage Guide

## Current AI workflow

This project uses Gemini to answer questions against uploaded user documents.
The backend does not send the entire document whenever possible.
Instead, it retrieves a limited set of relevant chunks and builds a compact prompt.

## AI pipeline

1. user uploads a document
2. backend extracts text from the file
3. backend chunks the text
4. chunks are stored in MongoDB
5. user asks a question
6. backend retrieves relevant chunks
7. backend builds a grounded prompt
8. Gemini returns the answer
9. backend stores the conversation

## Why this is a RAG-style design

Even though the current version uses MongoDB text search instead of embeddings, the structure already follows retrieval-augmented generation principles:

- retrieve relevant context
- augment the prompt with retrieved context
- generate a grounded answer

## Prompt strategy

The backend prompt instructs Gemini to:

- use only provided context
- say what is missing if context is insufficient
- keep the answer concise and factual

This reduces hallucination risk compared with asking the model without grounding.

## Token optimization choices

The system reduces token usage by:

- chunking documents
- limiting context chunk count
- avoiding full-document prompts
- storing parsed chunks once instead of reparsing every request

## Important environment variables

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-flash-latest
CHUNK_SIZE_CHARS=1200
CHUNK_OVERLAP_CHARS=200
MAX_CONTEXT_CHUNKS=6
```

## Recommended model strategy

If Gemini model availability changes, use a current alias first:

```env
GEMINI_MODEL=gemini-flash-latest
```

This reduces failures caused by retired fixed model names.

## Common Gemini failures

### Invalid API key
Cause: key is wrong or copied from the wrong project.

### Model not found
Cause: model is deprecated, restricted, or not supported for the current API version.

### Quota exceeded
Cause: free-tier quota or billing quota is exhausted.

## Production improvement ideas

- add model fallback order
- add retry policy for transient 429 errors
- add semantic retrieval with embeddings
- log latency and token usage more deeply
- add answer citations in the UI
