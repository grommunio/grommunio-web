<?php

require_once __DIR__ . '/lib/class.aiconfig.php';

/**
 * Pluginai — registers the AI Assistant plugin's settings defaults.
 *
 * On settings initialisation it injects the per-user preference defaults plus a
 * key-free snapshot of the server configuration (provider, model, which
 * features the administrator enabled). The client reads this to know whether AI
 * is available and what to show — without ever receiving the API key.
 */
class Pluginai extends Plugin {
	/**
	 * Register hooks.
	 */
	public function init() {
		$this->registerHook('server.core.settings.init.before');
	}

	/**
	 * Execute hook actions.
	 *
	 * @param string $eventID the id of the triggered hook
	 * @param mixed  $data    object(s) related to the hook
	 */
	public function execute($eventID, &$data) {
		switch ($eventID) {
			case 'server.core.settings.init.before':
				$this->injectPluginSettings($data);
				break;
		}
	}

	/**
	 * Inject default plugin settings and the key-free server info.
	 *
	 * @param array $data reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		$config = AIConfig::get();

		// The plugin is dormant until the administrator unlocks it (PLUGIN_AI_ENABLE)
		// AND the per-user default opts the user in. Until then this default is
		// false, so PluginMetaData.isEnabled() returns false and the plugin is not
		// instantiated at all (no toolbar buttons, no settings category, no calls).
		$userDefault = defined('PLUGIN_AI_USER_DEFAULT_ENABLE') ? (bool) PLUGIN_AI_USER_DEFAULT_ENABLE : false;

		$defaults = [
			'enable' => $config->enabled && $userDefault,

			// User preferences.
			'summary_length' => 'standard',  // brief | standard | detailed
			'translate_target' => 'auto',    // auto (UI language) | <language name>
			'compose_tone' => 'neutral',     // neutral | formal | friendly | concise
			'streaming' => $config->streaming,

			// Per-feature user toggles (each still gated by the admin master switch).
			'feature_summarize' => true,
			'feature_translate' => true,
			'feature_compose' => true,
			'feature_actions' => true,

			// Per-action user toggles.
			'action_meeting' => true,
			'action_task' => true,
			'action_contact' => true,
			'action_reply' => true,

			// Read-only server info for the client. Contains NO API key.
			'server' => $config->getPublicInfo(),
		];

		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'ai' => $defaults,
					],
				],
			],
		]);
	}
}
