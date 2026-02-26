$dirs = @(
    'c:\logi\tac-portal\lib',
    'c:\logi\tac-portal\hooks',
    'c:\logi\tac-portal\pages',
    'c:\logi\tac-portal\components',
    'c:\logi\tac-portal\store',
    'c:\logi\tac-portal\routes',
    'c:\logi\tac-portal\types',
    'c:\logi\tac-portal\tests'
)

$files = foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Get-ChildItem -Path $dir -Recurse -Include '*.ts', '*.tsx' |
        Where-Object { $_.Name -ne 'database.types.ts' }
    }
}

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    # AWB column references
    $content = $content -replace 'awb_number', 'cn_number'

    # Sender -> Consignor (DB column style)
    $content = $content -replace 'sender_name', 'consignor_name'
    $content = $content -replace 'sender_phone', 'consignor_phone'
    $content = $content -replace 'sender_address', 'consignor_address'
    $content = $content -replace 'sender_city', 'consignor_city'
    $content = $content -replace 'sender_state', 'consignor_state'
    $content = $content -replace 'sender_zip', 'consignor_zip'
    $content = $content -replace 'sender_pincode', 'consignor_pincode'
    $content = $content -replace 'sender_gstin', 'consignor_gstin'

    # Receiver -> Consignee (DB column style)
    $content = $content -replace 'receiver_name', 'consignee_name'
    $content = $content -replace 'receiver_phone', 'consignee_phone'
    $content = $content -replace 'receiver_address', 'consignee_address'
    $content = $content -replace 'receiver_city', 'consignee_city'
    $content = $content -replace 'receiver_state', 'consignee_state'
    $content = $content -replace 'receiver_zip', 'consignee_zip'
    $content = $content -replace 'receiver_pincode', 'consignee_pincode'
    $content = $content -replace 'receiver_gstin', 'consignee_gstin'

    # camelCase JS variable names
    $content = $content -replace 'senderAddress', 'consignorAddress'
    $content = $content -replace 'senderCity', 'consignorCity'
    $content = $content -replace 'senderState', 'consignorState'
    $content = $content -replace 'senderZip', 'consignorZip'
    $content = $content -replace 'receiverAddress', 'consigneeAddress'
    $content = $content -replace 'receiverCity', 'consigneeCity'
    $content = $content -replace 'receiverState', 'consigneeState'
    $content = $content -replace 'receiverZip', 'consigneeZip'

    # UI label strings
    $content = $content -replace "'SENDER'", "'CONSIGNOR'"
    $content = $content -replace "'RECIPIENT'", "'CONSIGNEE'"
    $content = $content -replace "'Sender'", "'Consignor'"
    $content = $content -replace "'Receiver'", "'Consignee'"
    $content = $content -replace '"Sender"', '"Consignor"'
    $content = $content -replace '"Receiver"', '"Consignee"'
    $content = $content -replace 'Sender Details', 'Consignor Details'
    $content = $content -replace 'Receiver Details', 'Consignee Details'
    $content = $content -replace 'Sender Name', 'Consignor Name'
    $content = $content -replace 'Sender Phone', 'Consignor Phone'
    $content = $content -replace 'Receiver Name', 'Consignee Name'
    $content = $content -replace 'Receiver Phone', 'Consignee Phone'
    $content = $content -replace 'Sender name required', 'Consignor name required'
    $content = $content -replace 'Sender phone required', 'Consignor phone required'
    $content = $content -replace 'Sender address required', 'Consignor address required'
    $content = $content -replace 'Receiver name required', 'Consignee name required'
    $content = $content -replace 'Receiver phone required', 'Consignee phone required'
    $content = $content -replace 'Receiver address required', 'Consignee address required'

    # Step descriptions
    $content = $content -replace "Sender & Receiver", "Consignor & Consignee"
    $content = $content -replace 'Consignor \(Consignor\)', 'Consignor'
    $content = $content -replace 'Consignee \(Consignee\)', 'Consignee'
    $content = $content -replace 'Consignor \(Sender\)', 'Consignor'
    $content = $content -replace 'Consignee \(Receiver\)', 'Consignee'

    # Search placeholders
    $content = $content -replace 'Search AWB', 'Search CN'
    $content = $content -replace 'search AWB', 'search CN'
    $content = $content -replace 'AWB, consignee, consignor', 'CN, consignee, consignor'
    $content = $content -replace 'AWB, receiver, sender', 'CN, consignee, consignor'

    # Column headers & labels
    $content = $content -replace '>AWB<', '>CN Number<'
    $content = $content -replace '>RECEIVER<', '>CONSIGNEE<'
    $content = $content -replace '>SENDER<', '>CONSIGNOR<'
    $content = $content -replace "'AWB'", "'CN Number'"
    $content = $content -replace "'AWB Number'", "'CN Number'"

    # JS state variables
    $content = $content -replace '\bsetSender\b', 'setConsignor'
    $content = $content -replace '\bsetReceiver\b', 'setConsignee'

    # Hook renames
    $content = $content -replace 'useFindShipmentByAwb', 'useFindShipmentByCN'
    $content = $content -replace 'FindShipmentByAwb', 'FindShipmentByCN'

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! All terminology updated."
