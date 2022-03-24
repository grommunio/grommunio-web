<?php
require_once __DIR__ . "/../class.ocsclient.php";

$server = "https://cloud.test.at";
$user = "testuser";
$pass = "testpassword";

$ocscloient = new \OCSAPI\ocsclient($server,$user,$pass);


echo "<br>################################## READING #######################<br>";

$ocscloient->loadShares();

$allshares = $ocscloient->getAllShares();

echo "Count of shares: " . count($allshares) . "<br>";

$share1 = $ocscloient->getShareByID(6);

echo "Share id 6: " . $share1->getId() . ":" . $share1->getPath() . "<br>";

$share2 = $ocscloient->getShareByPath($share1->getPath());

echo "Share should have the same id as before: " . $share2->getId() . "<br>";

$share3 = $ocscloient->loadShareByID(6);

print_r($share3);


echo "<br>################################## CREATING #######################<br>";

$options = array(
    "shareType" => 3
);
$created1 = $ocscloient->createShare("/aaaaaa/test.eml", $options);
print_r($created1);

echo "<br>################################## UPDATE #######################<br>";

$options = array(
    "shareType" => 3
);
$ocscloient->updateShare($created1->getId(), "expireDate", "2020-03-23");


echo "<br>################################## READING #######################<br>";

$share4 = $ocscloient->loadShareByID($created1->getId());

print_r($share4);

echo "<br>################################## DELETE #######################<br>";

$ocscloient->deleteShare($share4->getId());


echo "<br>################################## READING #######################<br>";

try {
    $deleteShare = $ocscloient->loadShareByID($share4->getId());
    print_r($deleteShare);
} catch (Exception $e) {
    print_r($e);
}
?>