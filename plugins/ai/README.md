# AI Assistant plugin for grommunio Web

A provider-agnostic AI assistant integrated into grommunio Web. It can:

- **Summarize** a single email or an entire conversation thread.
- **Translate** an email into your language (or a chosen target language).
- **Compose / reply assistant** — draft a reply, improve writing, shorten or
  expand, change tone, fix grammar, translate the draft.
- **Smart actions** (confirm-first) — from an email the assistant can propose:
  *create a meeting and invite people by name*, *create a task*, *add the sender
  as a contact*, or *draft a reply*. Each opens a **prefilled dialog you
  review**; nothing is committed without your click. Every action is toggleable.

## Disabled by default — the administrator unlocks it

The plugin ships **dormant**. Until an administrator sets `PLUGIN_AI_ENABLE` to
`true` in `config.php`, it adds no buttons, no menus and no settings page for
anyone, and makes no calls to any LLM. This is deliberate: the assistant sends
email content to a language model, so enabling it is an explicit decision.

After the admin unlocks it, each user still opts in individually under
**Settings → Plugins** (this is the default; `PLUGIN_AI_USER_DEFAULT_ENABLE`
can flip it to on-for-everyone).

## Provider-agnostic, free-cloud or fully sovereign

The plugin speaks two API dialects, which together cover essentially every
major LLM:

- **OpenAI-compatible** `/v1/chat/completions` — the de-facto standard, used by
  **free cloud tiers** (Google **Gemini**, **Groq**, **OpenRouter**), by OpenAI,
  Mistral, Together, Azure OpenAI, …, **and** by local/self-hosted servers
  (**Ollama**, LM Studio, vLLM, llama.cpp, LocalAI).
- **Anthropic Messages API** — the native Claude API.

The shipped default is **Google Gemini's free tier** (`gemini-2.0-flash`): strong
quality and excellent multilingual support, with a key you get in two clicks at
<https://aistudio.google.com/apikey> (no credit card). For **full data
sovereignty** — nothing leaves your server — switch to the local **Ollama**
preset, which needs no key at all.

> With any cloud provider, the email text you act on is sent to that provider.
> If that is not acceptable, use the local Ollama preset.

## How it stays private and secure

- All LLM calls happen **server-side** (PHP + cURL). The **API key is configured
  centrally in `config.php` and is never sent to the browser**, never logged,
  and never included in error messages.
- The client sends only the message reference (`store_entryid` + `entryid`) and
  the requested feature. The server reads the mail via MAPI, builds the prompt,
  calls the provider, and returns text.
- Because the outbound URL is fixed by the administrator (not user-supplied),
  there is no server-side request forgery surface.
- Email bodies are truncated to `PLUGIN_AI_MAX_INPUT_CHARS` before sending.

## Configuration (administrator)

Edit `plugins/ai/config.php`:

```php
// 1. Unlock the plugin for your users.
define('PLUGIN_AI_ENABLE', true);

// 2. Paste a key for the default provider (free Gemini), or switch presets.
define('PLUGIN_AI_PROVIDER', 'gemini');
define('PLUGIN_AI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai');
define('PLUGIN_AI_API_KEY', 'AIza...');           // from aistudio.google.com/apikey
define('PLUGIN_AI_MODEL', 'gemini-2.0-flash');
```

Ready-to-use commented presets for **Groq**, **OpenRouter**, **local Ollama**,
**OpenAI** and **Anthropic/Claude** are included in `config.php`; uncomment one
block to switch. Additional knobs: generation limits
(`PLUGIN_AI_MAX_INPUT_CHARS`, `..._MAX_OUTPUT_TOKENS`, `..._TEMPERATURE`,
`..._TIMEOUT`), streaming on/off, and master switches to disable individual
features and smart actions for the whole server.

End users can choose summary length, translation target language, compose tone,
and which enabled features they use — but never see or set the API key.

## Building

From the repository root or `plugins/ai/`:

```sh
make -C plugins/ai DESTDIR=/path/to/deploy
```

This copies the PHP/manifest/config/resources and concatenates the client
JavaScript into `js/ai-debug.js`, then minifies it to `js/ai.js` with terser.

## Development (no build step)

Set the loader to source mode in `config.php` (repository root) so the
individual JS source files listed in `manifest.xml` are served directly:

```php
define('DEBUG_LOADER', LOAD_SOURCE);
```

Then edit files under `plugins/ai/js/` and reload the browser.

## Requirements

- PHP with the cURL and MAPI extensions (standard in a grommunio deployment).
- A reachable LLM endpoint (a free cloud tier by default, or a local provider).
- For streaming, the front-end proxy must not buffer the response. The streaming
  endpoint at `php/stream.php` sends `X-Accel-Buffering: no`, which nginx
  honors. If you terminate gzip in front of grommunio-web, also disable it for
  this endpoint, since compression re-buffers the event stream:

  ```nginx
  location ~ /plugins/ai/php/stream\.php$ {
      gzip off;
      proxy_buffering off;
      # … plus your normal PHP-FPM fastcgi_pass / include
  }
  ```

  If streaming is unavailable the plugin falls back to a single buffered
  response automatically, so the feature keeps working either way.
