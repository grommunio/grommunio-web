<?php
/*
 * grommunio Web — AI Assistant plugin configuration.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * QUICK START
 *   1. Set PLUGIN_AI_ENABLE to true below to UNLOCK the assistant for your
 *      users. While it is false the plugin is completely dormant: no buttons,
 *      no menus, no settings page — for everyone.
 *   2. Paste an API key for the provider you want (the default is Google
 *      Gemini's free tier — see below). The key is read ONLY here on the
 *      server and is NEVER sent to the browser, logged, or put in an error.
 *   3. (Optional) Pick a different provider from the presets further down.
 *
 * After you unlock it, each user still opts in individually under
 * Settings -> Plugins (PLUGIN_AI_USER_DEFAULT_ENABLE controls that default).
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The plugin speaks two API dialects which together cover essentially every
 * major LLM:
 *   - OpenAI-compatible /v1/chat/completions — the de-facto standard. Works
 *     with FREE cloud tiers (Google Gemini, Groq, OpenRouter), with OpenAI,
 *     Mistral, Together, Azure OpenAI, ..., and with a LOCAL, self-hosted model
 *     (Ollama, LM Studio, vLLM, llama.cpp, LocalAI) for full data sovereignty.
 *   - Anthropic Messages API — the native Claude API (api.anthropic.com).
 */

// ===========================================================================
// MASTER SWITCH — the administrator's "unlock".
// While this is false the AI Assistant is unavailable to everyone, regardless
// of personal settings. Set it to true once a provider below is configured.
// ===========================================================================
define('PLUGIN_AI_ENABLE', false);

// After you unlock the plugin, should it be ON for each user by default?
//   false → every user opts in themselves under Settings → Plugins (default).
//   true  → on for everyone immediately; users may still opt out there.
define('PLUGIN_AI_USER_DEFAULT_ENABLE', false);

// ---------------------------------------------------------------------------
// DEFAULT PROVIDER: Google Gemini — generous FREE tier, no credit card.
// Get a key in two clicks at https://aistudio.google.com/apikey and paste it
// into PLUGIN_AI_API_KEY. Strong quality and excellent multilingual support.
// Note: with any cloud provider, the email text you act on is sent to that
// provider. For zero data egress, use the local Ollama preset further down.
// ---------------------------------------------------------------------------
define('PLUGIN_AI_PROVIDER', 'gemini');
define('PLUGIN_AI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai');
define('PLUGIN_AI_API_KEY', '');
define('PLUGIN_AI_MODEL', 'gemini-3.5-flash');

// Optional lighter/faster model for short tasks (e.g. translate). Leave empty
// to always use PLUGIN_AI_MODEL.
define('PLUGIN_AI_MODEL_FAST', 'gemini-3.5-flash-lite');

// --- Alternative providers — uncomment ONE block to use instead ------------
//
// Groq — FREE tier, extremely fast token streaming (https://console.groq.com):
// define('PLUGIN_AI_PROVIDER', 'groq');
// define('PLUGIN_AI_API_BASE', 'https://api.groq.com/openai/v1');
// define('PLUGIN_AI_API_KEY', 'gsk_...');
// define('PLUGIN_AI_MODEL', 'llama-3.3-70b-versatile');
//
// OpenRouter — many FREE ':free' models behind one key (https://openrouter.ai):
// define('PLUGIN_AI_PROVIDER', 'openrouter');
// define('PLUGIN_AI_API_BASE', 'https://openrouter.ai/api/v1');
// define('PLUGIN_AI_API_KEY', 'sk-or-...');
// define('PLUGIN_AI_MODEL', 'meta-llama/llama-3.3-70b-instruct:free');
//
// Local Ollama — fully sovereign, nothing leaves your server, no key needed.
// Install Ollama, then: `ollama pull llama3.1:8b`.
// define('PLUGIN_AI_PROVIDER', 'ollama');
// define('PLUGIN_AI_API_BASE', 'http://localhost:11434/v1');
// define('PLUGIN_AI_API_KEY', '');
// define('PLUGIN_AI_MODEL', 'llama3.1:8b');
//
// OpenAI:
// define('PLUGIN_AI_PROVIDER', 'openai');
// define('PLUGIN_AI_API_BASE', 'https://api.openai.com/v1');
// define('PLUGIN_AI_API_KEY', 'sk-...');
// define('PLUGIN_AI_MODEL', 'gpt-4o-mini');
//
// Anthropic / Claude:
// define('PLUGIN_AI_PROVIDER', 'anthropic');
// define('PLUGIN_AI_API_BASE', 'https://api.anthropic.com');
// define('PLUGIN_AI_API_KEY', 'sk-ant-...');
// define('PLUGIN_AI_MODEL', 'claude-3-5-haiku-latest');
//
// Any other OpenAI-compatible server (LM Studio, vLLM, LocalAI, ...):
// define('PLUGIN_AI_PROVIDER', 'openai_compatible');
// define('PLUGIN_AI_API_BASE', 'http://localhost:1234/v1');
// define('PLUGIN_AI_API_KEY', '');
// define('PLUGIN_AI_MODEL', 'your-model-name');

// --- Generation limits -----------------------------------------------------
// Email bodies longer than this many characters are truncated before sending.
define('PLUGIN_AI_MAX_INPUT_CHARS', 24000);
// Upper bound on tokens the model may generate per request.
define('PLUGIN_AI_MAX_OUTPUT_TOKENS', 1024);
// Sampling temperature (0 = deterministic, 1 = creative).
define('PLUGIN_AI_TEMPERATURE', 0.3);
// Network timeout (seconds) for a request to the LLM endpoint.
define('PLUGIN_AI_TIMEOUT', 120);
// Token-by-token streaming via Server-Sent Events. Falls back automatically
// to a single response if streaming is unavailable.
define('PLUGIN_AI_STREAMING', true);

// --- Feature master switches (turn a capability off for the whole server) --
define('PLUGIN_AI_ENABLE_SUMMARIZE', true);
define('PLUGIN_AI_ENABLE_TRANSLATE', true);
define('PLUGIN_AI_ENABLE_COMPOSE', true);
define('PLUGIN_AI_ENABLE_ACTIONS', true);

// --- Smart-action master switches (each opens a confirm-first dialog) ------
define('PLUGIN_AI_ACTION_MEETING', true);
define('PLUGIN_AI_ACTION_TASK', true);
define('PLUGIN_AI_ACTION_CONTACT', true);
define('PLUGIN_AI_ACTION_REPLY', true);
