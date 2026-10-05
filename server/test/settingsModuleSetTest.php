<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (!class_exists('Module')) {
	class Module {
		protected $data;
		public $feedback = [];

		public function __construct($id, $data) {
			$this->data = $data;
		}

		public function execute() {}

		protected function getExecutionLockName() {
			return null;
		}

		public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true) {
			$this->feedback[] = $success;
		}
	}
}

class RecordingSettings {
	public $calls = [];

	public function set($path, $value) {
		$this->calls[] = ['set', $path, $value];
	}

	public function setPersistent($path, $value) {
		$this->calls[] = ['setPersistent', $path, $value];
	}

	public function saveSettings() {
		$this->calls[] = ['save'];
	}

	public function savePersistentSettings() {
		$this->calls[] = ['savePersistent'];
	}
}

require_once dirname(__DIR__) . '/includes/modules/class.settingsmodule.php';

$GLOBALS['settings'] = new RecordingSettings();
$module = new SettingsModule(1, []);
$photo = 'data:image/jpeg;base64,AAAA';

// A single setting and a list of settings are both applied.
$module->set(['path' => 'grommunio/v1/main/thumbnail_photo', 'value' => $photo]);
$module->set([['path' => 'grommunio/v1/main/language', 'value' => 'de_DE']], true, false);
$expected = [
	['set', 'grommunio/v1/main/thumbnail_photo', $photo],
	['save'],
	['setPersistent', 'grommunio/v1/main/language', 'de_DE'],
];
if ($GLOBALS['settings']->calls !== $expected) {
	throw new RuntimeException('Settings were not applied: ' . json_encode($GLOBALS['settings']->calls));
}
if ($module->feedback !== [true, true]) {
	throw new RuntimeException('Missing success feedback.');
}

echo "Settings module set checks passed\n";
