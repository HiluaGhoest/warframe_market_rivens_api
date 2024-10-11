<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$response = ["message" => "Hello, World!"];
echo json_encode($response);
?>
