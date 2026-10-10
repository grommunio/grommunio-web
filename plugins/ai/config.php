<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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
 *     IONOS AI Model Hub, Mistral, Together, Azure OpenAI, ..., and with a
 *     LOCAL, self-hosted model (Ollama, LM Studio, vLLM, llama.cpp, LocalAI)
 *     for full data sovereignty. OpenAI models that are only served through
 *     the newer Responses API (/v1/responses) are switched over automatically.
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
define('PLUGIN_AI_MODEL', 'gemini-3.6-flash');
// Optional lighter/faster model of the same provider for short tasks (e.g.
// translate). Leave empty to always use PLUGIN_AI_MODEL.
define('PLUGIN_AI_MODEL_FAST', 'gemini-3.5-flash-lite');

// --- Alternative providers -------------------------------------------------
// Comment out the five Gemini lines above, then uncomment ONE block below.
//
// Groq — FREE tier, extremely fast token streaming (https://console.groq.com).
// gpt-oss reasons first; PLUGIN_AI_REASONING_EFFORT 'low' keeps that short:
// define('PLUGIN_AI_PROVIDER', 'groq');
// define('PLUGIN_AI_API_BASE', 'https://api.groq.com/openai/v1');
// define('PLUGIN_AI_API_KEY', 'gsk_...');
// define('PLUGIN_AI_MODEL', 'openai/gpt-oss-120b');
// define('PLUGIN_AI_MODEL_FAST', 'openai/gpt-oss-20b');
//
// OpenRouter — FREE models behind one key (https://openrouter.ai); the
// 'openrouter/free' router picks one of them:
// define('PLUGIN_AI_PROVIDER', 'openrouter');
// define('PLUGIN_AI_API_BASE', 'https://openrouter.ai/api/v1');
// define('PLUGIN_AI_API_KEY', 'sk-or-...');
// define('PLUGIN_AI_MODEL', 'openrouter/free');
// define('PLUGIN_AI_MODEL_FAST', '');
//
// Local Ollama — fully sovereign, nothing leaves your server, no key needed.
// Install Ollama, then: `ollama pull llama3.1:8b`.
// define('PLUGIN_AI_PROVIDER', 'ollama');
// define('PLUGIN_AI_API_BASE', 'http://localhost:11434/v1');
// define('PLUGIN_AI_API_KEY', '');
// define('PLUGIN_AI_MODEL', 'llama3.1:8b');
// define('PLUGIN_AI_MODEL_FAST', '');
//
// OpenAI — GPT-6 (gpt-6-astra, gpt-6.1-sol, gpt-6-luna), GPT-5.x, o-series
// and the classic gpt-4.1 / gpt-4o all work. GPT-5 and later are reasoning
// models; PLUGIN_AI_REASONING_EFFORT 'low' (below) keeps answers quick and
// the token bill small:
// define('PLUGIN_AI_PROVIDER', 'openai');
// define('PLUGIN_AI_API_BASE', 'https://api.openai.com/v1');
// define('PLUGIN_AI_API_KEY', 'sk-...');
// define('PLUGIN_AI_MODEL', 'gpt-6-luna');
// define('PLUGIN_AI_MODEL_FAST', '');
//
// IONOS AI Model Hub — hosted in Germany, prompts are neither logged nor
// used for training. Create the API token in the DCD under Management ->
// Token Manager (a valid token starts with "eyJ"):
// define('PLUGIN_AI_PROVIDER', 'ionos');
// define('PLUGIN_AI_API_BASE', 'https://openai.inference.de-txl.ionos.com/v1');
// define('PLUGIN_AI_API_KEY', 'eyJ...');
// define('PLUGIN_AI_MODEL', 'mistralai/Mistral-Small-24B-Instruct');
// define('PLUGIN_AI_MODEL_FAST', '');
// Larger alternatives: 'meta-llama/Llama-3.3-70B-Instruct', or the reasoning
// models 'openai/gpt-oss-120b' and 'Qwen/Qwen3.8-27B' (see
// PLUGIN_AI_REASONING_EFFORT below).
//
// Anthropic / Claude:
// define('PLUGIN_AI_PROVIDER', 'anthropic');
// define('PLUGIN_AI_API_BASE', 'https://api.anthropic.com');
// define('PLUGIN_AI_API_KEY', 'sk-ant-...');
// define('PLUGIN_AI_MODEL', 'claude-haiku-5-5');
// define('PLUGIN_AI_MODEL_FAST', '');
//
// Any other OpenAI-compatible server (LM Studio, vLLM, LocalAI, ...):
// define('PLUGIN_AI_PROVIDER', 'openai_compatible');
// define('PLUGIN_AI_API_BASE', 'http://localhost:1234/v1');
// define('PLUGIN_AI_API_KEY', '');
// define('PLUGIN_AI_MODEL', 'your-model-name');
// define('PLUGIN_AI_MODEL_FAST', '');

// --- Generation limits -----------------------------------------------------
// Email bodies longer than this many characters are truncated before sending.
define('PLUGIN_AI_MAX_INPUT_CHARS', 24000);
// Upper bound on tokens the model may generate per request. A reasoning model
// (Gemini 2.5+, GPT-5, o-series, ...) spends part of this budget on internal
// thinking tokens that never reach the user, so keep it generous. An answer
// that still ends on the limit is continued automatically.
define('PLUGIN_AI_MAX_OUTPUT_TOKENS', 4096);
// Sampling temperature (0 = deterministic, 1 = creative). Not sent to models
// that only take their default (reasoning models, Gemini 3+, current Claude).
define('PLUGIN_AI_TEMPERATURE', 0.3);
// Network timeout (seconds) for a request to the LLM endpoint.
define('PLUGIN_AI_TIMEOUT', 120);
// Token-by-token streaming via Server-Sent Events. Falls back automatically
// to a single response if streaming is unavailable.
define('PLUGIN_AI_STREAMING', true);

// --- Reasoning models (OpenAI GPT-5+, o-series, gpt-oss, Qwen3, ...) -------
// How hard the model thinks before it answers: '' leaves the model's own
// default, otherwise 'none', 'minimal', 'low', 'medium', 'high', 'xhigh' or
// 'max'. Which values a model accepts differs — gpt-6-astra and gpt-6.1-sol
// refuse 'none', the Qwen models on IONOS think unless it is 'none'.
define('PLUGIN_AI_REASONING_EFFORT', '');
// The same for PLUGIN_AI_MODEL_FAST.
define('PLUGIN_AI_REASONING_EFFORT_FAST', '');
// Whether the model is a reasoning model, which takes no custom temperature
// and no 'max_tokens'. 'auto' recognizes OpenAI's model names; set true or
// false when the name does not tell, e.g. for an Azure OpenAI deployment.
define('PLUGIN_AI_REASONING_MODEL', 'auto');
// OpenAI-compatible API to use: 'chat' (/chat/completions, understood by
// every provider above), 'responses' (/responses, OpenAI's newer API, also
// offered by IONOS, which cannot stream it, and Azure; not by Gemini) or
// 'auto' — chat, except for the models OpenAI only serves on /responses
// (gpt-5.5-pro and the other pro and codex models).
define('PLUGIN_AI_API_MODE', 'auto');

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
