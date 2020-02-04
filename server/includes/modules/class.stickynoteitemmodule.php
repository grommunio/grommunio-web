<?php
	/**
	 * StickyNote ItemModule
	 * Module which openes, creates, saves and deletes an item. It 
	 * extends the Module class.
	 */
	class StickyNoteItemModule extends ItemModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function __construct($id, $data)
		{
			parent::__construct($id, $data);

			$this->properties = $GLOBALS["properties"]->getStickyNoteProperties();

			$this->plaintext = true;
		}
	}
?>
