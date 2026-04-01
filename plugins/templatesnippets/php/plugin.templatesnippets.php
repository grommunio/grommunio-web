<?php

class Plugintemplatesnippets extends Plugin {

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
	 * Inject default plugin settings and system templates into the client settings.
	 *
	 * System templates are loaded once here (on login / settings init) so the client
	 * receives them as part of the normal settings payload and does not need to
	 * request them on-demand.
	 *
	 * @param array $data Reference to the data of the triggered hook
	 */
	public function injectPluginSettings(&$data) {
		$systemTemplates = $this->loadSystemTemplates();

		$isAdmin = false;
		if (defined('PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS') && is_array(PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS)) {
			$smtpAddress = $GLOBALS['mapisession']->getSMTPAddress();
			$isAdmin = in_array($smtpAddress, PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS, true);
		}

		$defaults = [
			'enable' => defined('PLUGIN_TEMPLATESNIPPETS_USER_DEFAULT_ENABLE') ? PLUGIN_TEMPLATESNIPPETS_USER_DEFAULT_ENABLE : false,
			'system_templates' => $systemTemplates,
			'is_admin' => $isAdmin,
		];

		$data['settingsObj']->addSysAdminDefaults([
			'zarafa' => [
				'v1' => [
					'plugins' => [
						'templatesnippets' => $defaults,
					],
				],
			],
		]);
	}

	/**
	 * Load all system templates from the configured directory.
	 *
	 * Each template is a JSON file with the structure:
	 * {
	 *   "name": "Template Name",
	 *   "html": "<p>HTML content</p>",
	 *   "text": "Plain text content"
	 * }
	 *
	 * @return array Associative array of templates keyed by filename (without extension)
	 */
	public function loadSystemTemplates() {
		$templates = [];
		$dir = defined('PLUGIN_TEMPLATESNIPPETS_SYSTEM_DIR') ? PLUGIN_TEMPLATESNIPPETS_SYSTEM_DIR : '/var/lib/grommunio-web/templates';

		if (!is_dir($dir)) {
			return $templates;
		}

		$files = glob($dir . '/*.json');
		if ($files === false) {
			return $templates;
		}

		foreach ($files as $file) {
			$content = file_get_contents($file);
			if ($content === false) {
				continue;
			}

			$tpl = json_decode($content, true);
			if (!is_array($tpl) || empty($tpl['name'])) {
				continue;
			}

			$key = pathinfo($file, PATHINFO_FILENAME);
			$templates[$key] = [
				'name' => (string) $tpl['name'],
				'html' => isset($tpl['html']) ? (string) $tpl['html'] : '',
				'text' => isset($tpl['text']) ? (string) $tpl['text'] : '',
			];
		}

		return $templates;
	}
}
