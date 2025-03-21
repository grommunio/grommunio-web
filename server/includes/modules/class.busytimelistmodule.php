<?php

/**
 * BusyTime Module.
 */
require_once BASE_PATH . 'server/includes/modules/class.appointmentlistmodule.php';

class BusyTimeListModule extends AppointmentListModule {
	/**
	 * @var array the properties sent back to the client - a minimal set of data
	 */
	private $minproperties;

	/**
	 * Constructor.
	 *
	 * @param int   $id   unique id
	 * @param array $data list of all actions
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
		$this->minproperties = $GLOBALS["properties"]->getBusyTimeProperties();
	}

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	#[Override]
	public function createNotifiers() {
		// Keep empty, the BusyTimeListModule doesn't need notifiers.
	}

	/**
	 * Process calendar items to prepare them for being sent back to the client.
	 *
	 * @param array  $calendaritems array of appointments retrieved from the mapi tablwe
	 * @param object $store         message store
	 * @param mixed  $entryid
	 * @param int    $start         startdate of the interval
	 * @param int    $end           enddate of the interval
	 *
	 * @return array $items processed items
	 */
	#[Override]
	public function processItems($calendaritems, $store, $entryid, $start, $end) {
		$items = [];
		foreach ($calendaritems as $calendaritem) {
			if (isset($calendaritem[$this->properties["recurring"]]) && $calendaritem[$this->properties["recurring"]]) {
				$recurrence = new Recurrence($store, $calendaritem);
				$recuritems = $recurrence->getItems($start, $end);

				foreach ($recuritems as $recuritem) {
					$item = Conversion::mapMAPI2XML($this->minproperties, $recuritem);

					// only add it in response if its not removed by above function
					if (!empty($item)) {
						array_push($items, $item['props']);
					}
				}
			}
			else {
				$item = Conversion::mapMAPI2XML($this->minproperties, $calendaritem);

				// only add it in response if its not removed by above function
				if (!empty($item)) {
					array_push($items, $item['props']);
				}
			}
		}

		return $items;
	}
}
