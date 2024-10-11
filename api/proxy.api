<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow CORS for any origin (you can restrict this to specific origins if needed)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Check if the request method is GET
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    // Get the selected weapon from the query parameters
    if (isset($_GET['weapon'])) {
        $weapon = $_GET['weapon'];
        
        // URL encode the weapon name to ensure it’s safe for use in the URL
        $weapon_encoded = urlencode($weapon);
        
        // Construct the API URL based on the selected weapon
        $url = 'https://api.warframe.market/v1/auctions/search?type=riven&buyout_policy=direct&weapon_url_name=' . $weapon_encoded . '&sort_by=price_asc';

        // Create a context with a User-Agent header
        $options = [
            "http" => [
                "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3\r\n"
            ]
        ];
        $context = stream_context_create($options);

        // Fetch the API data
        $response = @file_get_contents($url, false, $context); // Suppress warnings

        // Check for errors
        if ($response === FALSE) {
            // Fetch error details
            $error = error_get_last();
            // Send a 500 Internal Server Error if fetching fails
            http_response_code(500);
            echo json_encode(['error' => 'Unable to fetch data from the API.', 'details' => $error]);
            exit();
        }

        // Send the response back to the client
        echo $response;
    } else {
        // Handle case where weapon parameter is missing
        http_response_code(400);
        echo json_encode(['error' => 'Weapon parameter is required.']);
    }
} else {
    // Handle unsupported request methods
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed.']);
}
?>
