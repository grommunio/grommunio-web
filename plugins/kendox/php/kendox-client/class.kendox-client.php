<?php
namespace Kendox;

    require_once("class.kendox-token-generator.php");

    class Client
    {
        
        /**
         * Generated token for user
         * 
         * @var StdClass
         */
        public $Token = null;

        /**
         * URL of Kendox Service Endpoint
         * @var string
         */
        public $ServiceEndpoint = null;

        /**
         * Connection Id returned from service on successful login
         * @var string
         */
        public $ConnectionId = null;

        function __construct($serviceEndpoint)
        {
            if (!str_ends_with($serviceEndpoint, '/')) $serviceEndpoint .= '/';
            $this->ServiceEndpoint = $serviceEndpoint;
        }

        /**
         * Login to kendox service by creating a user based token, signed by Kendox trusted certificate
         * 
         * @param string $pfxFile The full path and file name of the PFX-File (certificate)
         * @param string $pfxPassword The password used for reading the PFX-File (certificate)
         * @param string $userName Username for token generation
         * 
         * @return bool
         */
        public function loginWithToken($pfxFile, $pfxPassword, $userName) {
            try {
                $issuer = gethostname();
                $tokenGenerator = new \Kendox\TokenGenerator($issuer, $pfxFile, $pfxPassword);
                $this->Token = $tokenGenerator->generateToken($userName);                
                $logonParameters = [
                    "tenantName" => "",
                    "token" => $this->Token,
                    "tokenType" => "InfoShareToken"
                ];
                $result = $this->post("Authentication/LogonWithToken", $logonParameters);
                $this->ConnectionId = $result->LogonWithTokenResult->ConnectionId;
                return true;
            } catch(\Exception $ex) {
                throw new \Exception("Token-Login failed: ".$ex->getMessage());
            }
        }

        /**
         * Logout from kendox
         * 
         * @return bool
         */
        public function logout() {
            try {
                $logoutParameters = [
                    "connectionId" => $this->ConnectionId
                ];
                $result = $this->post("Authentication/Logout", $logoutParameters);
                $this->ConnectionId = null;
                return true;
            } catch(\Exception $ex) {
                throw new \Exception("Token-Login failed: ".$ex->getMessage());
            }
        }

        /**
         * Performs a user table query and fetch the result records
         * 
         * @param $userTableName The name of the user table
         * @param $whereClauseElements Array with fields "ColumnName", "RelationalOperator" and "Value" for filter defintion of the query
         * @param $addColumnHeaders Add column headers to result?
         * 
         * @return array The data result as an array
         */
        public function userTableQuery($userTableName, $whereClauseElements, $addColumnHeaders) {
            try {
                $parameters = [
                    "connectionId" => $this->ConnectionId,
                    "userTable" => $userTableName,
                    "whereClauseElements" => $whereClauseElements,
                    "addColumnHeaders" => $addColumnHeaders
                ];
                $result = $this->post("UserTable/UserTableGetRecords", $parameters);
                if (!isset($result->UserTableGetRecordsResult)) throw new \Exception("Unexpected result");
                return $result->UserTableGetRecordsResult;
            } catch(\Exception $ex) {
                throw new \Exception("User table query failed: ".$ex->getMessage());
            }
        }

        /**
         * Uploading a file
         * @param string $file Path and file name of file to upload
         */
        public function uploadFile($file) {
            $content = file_get_contents($file);
            return $this->uploadContent($content);
        }

        /**
         * Uploading a stream of data
         * @param Stream $stream Stream of content to upload
         */
        public function uploadStream($stream) {
            $content = stream_get_contents($stream);
            return $this->uploadContent($content);
        }

        private function uploadContent($content) {
            $base64 = base64_encode($content);
            $uploadParameters = [
                "connectionId" => $this->ConnectionId,
                "fileContentbase64" => $base64
            ];            
            $result = $this->post("File/UploadFileBase64", $uploadParameters);            
            return $result->UploadFileBase64Result;
        }

        /**
         * Performing a post request to service
         * 
         * @param string $path the route to the API endpoint (without service endpoint url)
         * @param string Associated array with data to post
         * 
         * @return object Returns object with data. If service returns an error an exception will be thrown with detailed information
         */
        private function post($path, $data)
        {
            $ch = curl_init();
            //curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_URL, $this->ServiceEndpoint.$path);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            $jsonResult = curl_exec($ch);
            if (curl_errno($ch)) {
                throw new \Exception("Error on post request: ".curl_errno($ch));
            }
            return $this->handleJsonResult($jsonResult);

        }
        
        private function handleJsonResult($json)
        {
            if ($json === FALSE) {
                throw new \Exception("No valid JSON has been returned from service.");
            }
            $result = json_decode($json);
            if (isset($result->ErrorNumber)) {
                throw new \Exception("(".$result->ErrorNumber.") ".$result->Message);
            }
            return $result;
        }

    }

?>