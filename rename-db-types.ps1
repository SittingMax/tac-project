$file = 'c:\logi\tac-portal\lib\database.types.ts'
$content = [System.IO.File]::ReadAllText($file)

$content = $content -replace 'awb_number', 'cn_number'
$content = $content -replace 'sender_name', 'consignor_name'
$content = $content -replace 'sender_phone', 'consignor_phone'
$content = $content -replace 'sender_address', 'consignor_address'
$content = $content -replace 'receiver_name', 'consignee_name'
$content = $content -replace 'receiver_phone', 'consignee_phone'
$content = $content -replace 'receiver_address', 'consignee_address'
$content = $content -replace 'generate_awb_number', 'generate_cn_number'
$content = $content -replace 'get_public_shipment_by_awb', 'get_public_shipment_by_cn'
$content = $content -replace 'awb_code', 'cn_code'

[System.IO.File]::WriteAllText($file, $content)
Write-Host "database.types.ts updated"
