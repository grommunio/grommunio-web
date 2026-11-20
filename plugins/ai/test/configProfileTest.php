<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!function_exists('_')) {
	function _(string $s): string {
		return $s;
	}
}
ini_set('error_log', '/dev/null');
require_once dirname(__DIR__) . '/php/lib/class.aiconfig.php';

function check(bool $ok, string $what): void {
	if (!$ok) {
		throw new RuntimeException("AI config profiles: {$what}");
	}
}

define('PLUGIN_AI_ENABLE', true);
define('PLUGIN_AI_PROVIDER', 'gemini');
define('PLUGIN_AI_API_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai');
define('PLUGIN_AI_API_KEY', 'AIza-default');
define('PLUGIN_AI_MODEL', 'gemini-3.6-flash');
define('PLUGIN_AI_MODEL_FAST', 'gemini-3.5-flash-lite');
define('PLUGIN_AI_ACTION_TASK', true);
define('PLUGIN_AI_PROFILES', [
	'ionos' => ['provider' => 'ionos', 'api_key' => 'eyJ-ionos'],
	'local' => ['PROVIDER' => 'ollama', 'model' => 'qwen3:8b', 'action_task' => false],
	'bigger' => ['model' => 'gemini-3.6-pro'],
	'off' => ['enable' => false],
]);
define('PLUGIN_AI_PROFILE_MAP', [
	'Boss@Example.com' => 'ionos',
	'example.com' => 'local',
	'org:acme.test' => 'bigger',
	'off.test' => 'off',
	'typo.test' => 'ionso',
]);

$calls = 0;
$org = static function () use (&$calls) {
	++$calls;

	return ['Acme.test', 'acme-sub.test'];
};
$none = static fn () => [];

$c = AIConfig::forUser('nobody@else.test', $none);
check($c->provider === 'gemini' && $c->apiKey === 'AIza-default' && $c->isConfigured(), 'unmapped user keeps the defaults');

$c = AIConfig::forUser('boss@example.com', $none);
check($c->provider === 'ionos' && $c->apiKey === 'eyJ-ionos', 'user entry wins over the domain');
check($c->apiBase === 'https://openai.inference.de-txl.ionos.com/v1' && $c->model === 'mistralai/Mistral-Small-24B-Instruct', 'own provider gets its own base and model');
check($c->modelFor('translate') === $c->model, 'no fast model inherited from another provider');

$c = AIConfig::forUser('worker@EXAMPLE.com', $none);
check($c->provider === 'ollama' && $c->apiKey === '' && $c->model === 'qwen3:8b' && $c->isConfigured(), 'domain entry');
check(!$c->actionEnabled('task') && $c->actionEnabled('meeting'), 'profile switches a feature');

$c = AIConfig::forUser('ann@acme-sub.test', $org);
check($c->provider === 'gemini' && $c->apiKey === 'AIza-default' && $c->model === 'gemini-3.6-pro', 'org entry overrides only what it names');
check($calls === 1, 'organisation looked up once');
AIConfig::forUser('boss@example.com', $org);
check($calls === 1, 'organisation not looked up when the user or domain matches');

$c = AIConfig::forUser('x@off.test', $none);
check(!$c->isConfigured() && $c->missingReason() === 'The AI assistant is not enabled for your account.', 'profile switches AI off');

$c = AIConfig::forUser('x@typo.test', $none);
check(!$c->isConfigured() && str_contains($c->missingReason(), '"ionso"'), 'unknown profile fails closed');

echo "AI config profile checks passed\n";
