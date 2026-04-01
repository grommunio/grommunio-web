<?php

/**
 * Module for managing system-provided templates.
 *
 * Only users listed in PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS may use this module.
 * Provides save (create/update) and delete operations for system template JSON
 * files stored under PLUGIN_TEMPLATESNIPPETS_SYSTEM_DIR.
 */
class TemplateSnippetsModule extends Module {

	/**
	 * Process incoming actions from the client.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					if (!$this->isAdmin()) {
						$this->sendFeedback(false, [
							'type' => ERROR_ZARAFA,
							'info' => [
								'display_message' => _('You do not have permission to manage system templates.'),
							],
						]);
						continue;
					}
					match ($actionType) {
						'save' => $this->saveTemplate($actionData),
						'delete' => $this->deleteTemplate($actionData),
						default => $this->handleUnknownActionType($actionType),
					};
				}
				catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				}
			}
		}
	}

	/**
	 * Check whether the current user is an admin.
	 *
	 * @return bool
	 */
	private function isAdmin() {
		if (!defined('PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS') || !is_array(PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS)) {
			return false;
		}
		$smtpAddress = $GLOBALS['mapisession']->getSMTPAddress();
		return in_array($smtpAddress, PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS, true);
	}

	/**
	 * Return the system templates directory, ensuring it exists.
	 *
	 * @return string|false The directory path, or false on failure
	 */
	private function getTemplateDir() {
		$dir = defined('PLUGIN_TEMPLATESNIPPETS_SYSTEM_DIR') ? PLUGIN_TEMPLATESNIPPETS_SYSTEM_DIR : '/var/lib/grommunio-web/templates';
		if (!is_dir($dir)) {
			if (!@mkdir($dir, 0755, true)) {
				return false;
			}
		}
		return $dir;
	}

	/**
	 * Sanitize a template key to a safe filename component.
	 *
	 * @param string $key
	 * @return string
	 */
	private function sanitizeKey($key) {
		return preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
	}

	/**
	 * Save (create or update) a system template.
	 *
	 * @param array $data {key, name, html, text}
	 */
	public function saveTemplate($data) {
		if (empty($data['name'])) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Template name is required.')],
			]);
			return;
		}

		$dir = $this->getTemplateDir();
		if ($dir === false) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Cannot create template directory.')],
			]);
			return;
		}

		// Use provided key or generate one from the name
		$key = !empty($data['key']) ? $this->sanitizeKey($data['key']) : $this->sanitizeKey($data['name']) . '_' . time();

		$tpl = [
			'name' => (string) $data['name'],
			'html' => isset($data['html']) ? (string) $data['html'] : '',
			'text' => isset($data['text']) ? (string) $data['text'] : '',
		];

		$file = $dir . '/' . $key . '.json';
		$result = file_put_contents($file, json_encode($tpl, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

		if ($result === false) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Failed to write template file.')],
			]);
			return;
		}

		$this->sendFeedback(true, [
			'item' => [[
				'key' => $key,
				'name' => $tpl['name'],
				'html' => $tpl['html'],
				'text' => $tpl['text'],
			]],
		]);
	}

	/**
	 * Delete a system template.
	 *
	 * @param array $data {key}
	 */
	public function deleteTemplate($data) {
		if (empty($data['key'])) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Template key is required.')],
			]);
			return;
		}

		$dir = $this->getTemplateDir();
		if ($dir === false) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Template directory not found.')],
			]);
			return;
		}

		$key = $this->sanitizeKey($data['key']);
		$file = $dir . '/' . $key . '.json';

		if (!is_file($file)) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Template file not found.')],
			]);
			return;
		}

		if (!@unlink($file)) {
			$this->sendFeedback(false, [
				'type' => ERROR_ZARAFA,
				'info' => ['display_message' => _('Failed to delete template file.')],
			]);
			return;
		}

		$this->sendFeedback(true, [
			'info' => ['display_message' => _('Template deleted successfully.')],
		]);
	}
}
