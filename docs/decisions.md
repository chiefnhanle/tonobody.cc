# Implementation decisions

- The app uses a path field for vault selection so that the Nitro server, not the browser, owns filesystem writes.
- Raw captures are never edited or deleted by the UI in version 1.
- The index in `.thought-vault/app-state.json` is a cache. Markdown files remain the source of truth.
- Attachment content type is derived from the sanitized extension on the server instead of trusting the browser-provided MIME type.
- If attachment copying fails, the capture Markdown is not written.
