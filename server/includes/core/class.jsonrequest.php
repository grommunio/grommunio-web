<?php

/**
 * JSON Request handler.
 *
 * This class handles all incoming JSON requests from the client. In short, it receives the JSON,
 * decodes JSON data, then sends the requests to the correct modules, and builds the reply JSON. The reply
 * JSON is encoded and then returned for reply.
 */
class JSONRequest {
	public function __construct() {}

	/**
	 * Execute incoming JSON request.
	 *
	 * This function executes the actions in the JSON, which are received from
	 * the client. The entire JSON request is processed at once here, and this function
	 * is therefore called only once for each HTTP request to the server.
	 *
	 * @param string $json the json string which is received by the client
	 *
	 * @return string the built json which will be sent back to the client
	 *
	 * @todo Reduce overhead by outputting created JSON by outputting directly to php://output instead of returning a
	 *       (possibly huge) string containing the serialized JSON
	 */
	public function execute($json) {
		/* If json_encode produces an empty string, wa-js shows an absolutely
		 * worthless "Invalid data received from the server" dialog. */
		$jsonflags = JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE;

		try {
			// decode JSON data
			$data = json_decode_data($json, true);

			// Reset the bus
			$GLOBALS["bus"]->reset();

			// notify modules that wants to do something at the start of a request
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, REQUEST_START);

			// Check if the JSON is parsed correctly into an array
			$data = $data["zarafa"] ?: false;

			// @TODO throw exception if zarafa tag is not present
			if (is_array($data)) {
				// Open the module session state once for all modules.
				// This avoids repeated fopen/flock/unserialize/serialize/
				// fclose cycles when a request contains multiple modules.
				$moduleSessionState = new State('module_sessiondata');
				$moduleSessionState->open();

				try {
					// iterate over all module names
					foreach ($data as $moduleName => $modules) {
						// each module can contain multiple requests using different module ids
						foreach ($modules as $moduleId => $moduleData) {
							// Create the module via the Dispatcher
							$moduleObj = $GLOBALS["dispatcher"]->loadModule($moduleName, $moduleId, $moduleData);

							// Check if the module is loaded
							if (is_object($moduleObj)) {
								$moduleObj->loadSessionData($moduleSessionState);

								// Execute the actions in the module
								$moduleObj->execute();

								$moduleObj->saveSessionData();
							}
						}
					}
				}
				finally {
					// Flush and release the shared module session state.
					$moduleSessionState->flush();
					$moduleSessionState->close();
				}
			}

			// notify modules that wants to do something at the end of a request
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, REQUEST_END);

			// Build the JSON and return it
			return json_encode(["zarafa" => $GLOBALS["bus"]->getData()], $jsonflags);
		}
		catch (ZarafaException $e) {
			if (!$e->isHandled) {
				$data = [
					"error" => [
						"type" => ERROR_ZARAFA,
						"info" => [
							"file" => $e->getFileLine(),
							"display_message" => $e->getDisplayMessage(),
							"original_message" => $e->getMessage(),
						],
					],
				];

				return json_encode(["zarafa" => $data], $jsonflags);
			}
		}
		catch (ZarafaErrorException $e) {
			if (!$e->isHandled) {
				$data = [
					"error" => [
						"type" => ERROR_GENERAL,
						"info" => [
							"file" => $e->getFileLine(),
							"display_message" => $e->getDisplayMessage(),
							"original_message" => $e->getMessage(),
						],
					],
				];

				return json_encode(["zarafa" => $data], $jsonflags);
			}
		}
		catch (Exception $e) {
			// handle exceptions that are not handled by modules
			dump($e);

			$data = [
				"error" => [
					"type" => ERROR_GENERAL,
					"info" => [
						"file" => basename($e->getFile()) . ':' . $e->getLine(),
						"display_message" => _('An unexpected error has occurred'),
						"original_message" => $e->getMessage(),
					],
				],
			];

			return json_encode(["zarafa" => $data], $jsonflags);
		}
		catch (Throwable $e) {
			// Catch PHP Errors/TypeErrors as JSON to avoid HTTP 500s
			dump($e);

			$data = [
				"error" => [
					"type" => ERROR_GENERAL,
					"info" => [
						"file" => basename($e->getFile()) . ':' . $e->getLine(),
						"display_message" => _('An unexpected error has occurred'),
						"original_message" => $e->getMessage(),
					],
				],
			];

			return json_encode(["zarafa" => $data], $jsonflags);
		}
	}
}
