<?php

/**
 * This class implements a files backend account.
 *
 * @class Account
 */

namespace Files\Core;

use Files\Backend\BackendStore;

class Account {
	// for locking accounts

	/**
	 * Status variables.
	 */
	public const STATUS_NEW = "new";
	public const STATUS_OK = "ok";
	public const STATUS_ERROR = "err";
	public const STATUS_UNKNOWN = "unk";

	/**
	 * @param array $features
	 * @param mixed $sequence
	 * @param mixed $cannot_change
	 */
	public function __construct(private $id, private $name, private $status, private $statusDescription, private $backend, private $backendConfig, private $features, private $sequence, private $cannot_change) {}

	/**
	 * @return mixed
	 */
	public function getBackend() {
		return $this->backend;
	}

	/**
	 * @param mixed $backend
	 */
	public function setBackend($backend) {
		$this->backend = $backend;
	}

	/**
	 * @return mixed
	 */
	public function getId() {
		return $this->id;
	}

	/**
	 * @param mixed $id
	 */
	public function setId($id) {
		$this->id = $id;
	}

	/**
	 * @return mixed
	 */
	public function getName() {
		return $this->name;
	}

	/**
	 * @param mixed $name
	 */
	public function setName($name) {
		$this->name = $name;
	}

	/**
	 * @return mixed
	 */
	public function getStatus() {
		return $this->status;
	}

	/**
	 * @param mixed $status
	 */
	public function setStatus($status) {
		$this->status = $status;
	}

	/**
	 * @return mixed
	 */
	public function getBackendConfig() {
		// always add the accountID to the backendConfig
		$this->backendConfig["current_account_id"] = $this->getId();

		return $this->backendConfig;
	}

	/**
	 * @param mixed $backendConfig
	 */
	public function setBackendConfig($backendConfig) {
		$this->backendConfig = $backendConfig;
	}

	/**
	 * @return mixed
	 */
	public function getFeatures() {
		return $this->features;
	}

	/**
	 * @param mixed $features
	 */
	public function setFeatures($features) {
		$this->features = $features;
	}

	/**
	 * @return string
	 */
	public function getStatusDescription() {
		return $this->statusDescription;
	}

	/**
	 * @param string $statusDescription
	 */
	public function setStatusDescription($statusDescription) {
		$this->statusDescription = $statusDescription;
	}

	/**
	 * @return mixed
	 */
	public function getConfigValue($property) {
		if (is_array($this->backendConfig) && in_array($property, $this->backendConfig)) {
			return $this->backendConfig[$property];
		}

		return false;
	}

	public function setConfigValue($property, $value) {
		if (!is_array($this->backendConfig)) {
			$this->backendConfig = [];
		}
		$this->backendConfig[$property] = $value;
	}

	/**
	 * This function is executed before the account gets deleted.
	 */
	public function beforeDelete() {
		$backendstore = BackendStore::getInstance();
		$backendinstance = $backendstore->getInstanceOfBackend($this->backend);
		$backendinstance->init_backend($this->backendConfig);
		$backendinstance->open();
		$backendinstance->beforeDeleteAccount($this);
	}

	/**
	 * @return int
	 */
	public function getSequence() {
		if (!$this->sequence) {
			$this->sequence = 0;
		}

		return $this->sequence;
	}

	/**
	 * @param int $sequence
	 */
	public function setSequence($sequence) {
		$this->sequence = $sequence;
	}

	/**
	 * @return bool
	 */
	public function getCannotChangeFlag() {
		return $this->cannot_change ?? false;
	}
}
