<?php
/**
 * This class implemets a files backend account
 *
 * @class Account
 */

namespace Files\Core;

use Files\Backend\BackendStore;

class Account
{
	private $id;
	private $name; // account name - for better usability
	private $status;
	private $statusDescription;
	private $backend;
	private $backendConfig; // This array will hold the backend configuration variables
	private $features;
	private $sequence; // for ordering
	private $cannot_change; // for locking accounts

	/**
	 * Status variables
	 */
	const STATUS_NEW = "new";
	const STATUS_OK = "ok";
	const STATUS_ERROR = "err";
	const STATUS_UNKNOWN = "unk";

	/**
	 * @param       $id
	 * @param       $name
	 * @param       $status
	 * @param       $statusDescription
	 * @param       $backend
	 * @param       $backendConfig
	 * @param array $features
	 */
	function __construct($id, $name, $status, $statusDescription, $backend, $backendConfig, $features = array(), $sequence, $cannot_change)
	{
		$this->id = $id;
		$this->name = $name;
		$this->status = $status;
		$this->statusDescription = $statusDescription;
		$this->backend = $backend;
		$this->backendConfig = $backendConfig;
		$this->features = $features;
		$this->sequence = $sequence;
		$this->cannot_change = $cannot_change;
	}

	/**
	 * @return mixed
	 */
	public function getBackend()
	{
		return $this->backend;
	}

	/**
	 * @param mixed $backend
	 */
	public function setBackend($backend)
	{
		$this->backend = $backend;
	}

	/**
	 * @return mixed
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @param mixed $id
	 */
	public function setId($id)
	{
		$this->id = $id;
	}

	/**
	 * @return mixed
	 */
	public function getName()
	{
		return $this->name;
	}

	/**
	 * @param mixed $name
	 */
	public function setName($name)
	{
		$this->name = $name;
	}

	/**
	 * @return mixed
	 */
	public function getStatus()
	{
		return $this->status;
	}

	/**
	 * @param mixed $status
	 */
	public function setStatus($status)
	{
		$this->status = $status;
	}

	/**
	 * @return mixed
	 */
	public function getBackendConfig()
	{
		// always add the accountID to the backendConfig
		$this->backendConfig["current_account_id"] = $this->getId();

		return $this->backendConfig;
	}

	/**
	 * @param mixed $backendConfig
	 */
	public function setBackendConfig($backendConfig)
	{
		$this->backendConfig = $backendConfig;
	}

	/**
	 * @return mixed
	 */
	public function getFeatures()
	{
		return $this->features;
	}

	/**
	 * @param mixed $features
	 */
	public function setFeatures($features)
	{
		$this->features = $features;
	}

	/**
	 * @return string
	 */
	public function getStatusDescription()
	{
		return $this->statusDescription;
	}

	/**
	 * @param string $statusDescription
	 */
	public function setStatusDescription($statusDescription)
	{
		$this->statusDescription = $statusDescription;
	}

	/**
	 * @param $property
	 *
	 * @return mixed
	 */
	public function getConfigValue($property)
	{
		if (is_array($this->backendConfig) && in_array($property, $this->backendConfig)) {
			return $this->backendConfig[$property];
		}

		return false;
	}

	/**
	 * @param $property
	 * @param $value
	 */
	public function setConfigValue($property, $value)
	{
		if (!is_array($this->backendConfig)) {
			$this->backendConfig = array();
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
	public function getSequence()
	{
		if(!$this->sequence) {
			$this->sequence = 0;
		}

		return $this->sequence;
	}

	/**
	 * @param int $sequence
	 */
	public function setSequence($sequence)
	{
		$this->sequence = $sequence;
	}

	/**
	 * @return boolean
	 */
	public function getCannotChangeFlag()
	{
		return isset($this->cannot_change) ? $this->cannot_change : false;
	}
}
