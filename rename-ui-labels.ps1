$dirs = @(
    'c:\logi\tac-portal\lib',
    'c:\logi\tac-portal\hooks',
    'c:\logi\tac-portal\pages',
    'c:\logi\tac-portal\components',
    'c:\logi\tac-portal\store',
    'c:\logi\tac-portal\routes',
    'c:\logi\tac-portal\types'
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

    # UI-facing label replacements (user-visible strings)
    $content = $content -replace 'AWB Number', 'CN Number'
    $content = $content -replace 'AWB number', 'CN number'
    $content = $content -replace 'AWB REF', 'CN REF'
    $content = $content -replace 'AWB: ', 'CN: '
    $content = $content -replace 'AWB copied', 'CN copied'
    $content = $content -replace 'Search by AWB', 'Search by CN'
    $content = $content -replace 'SCAN PACKAGE AWB', 'SCAN PACKAGE CN'
    $content = $content -replace 'QUERY AWB', 'QUERY CN'
    $content = $content -replace 'Scan AWB', 'Scan CN'
    $content = $content -replace 'SCAN AWB', 'SCAN CN'
    $content = $content -replace 'ENTER AWB', 'ENTER CN'
    $content = $content -replace 'Enter AWB', 'Enter CN'
    $content = $content -replace 'enter AWB', 'enter CN'
    $content = $content -replace 'search AWB', 'search CN'
    $content = $content -replace 'missing AWB', 'missing CN'
    $content = $content -replace 'Missing AWB', 'Missing CN'
    $content = $content -replace "NO-AWB", "NO-CN"
    $content = $content -replace "for AWB", "for CN"
    $content = $content -replace 'scanning AWBs', 'scanning CNs'
    $content = $content -replace 'AWB barcodes', 'CN barcodes'
    $content = $content -replace 'an AWB', 'a CN'
    $content = $content -replace 'the AWB', 'the CN'
    $content = $content -replace 'AWB Required', 'CN Required'
    $content = $content -replace 'AWB_REQUIRED', 'CN_REQUIRED'
    $content = $content -replace 'AWB_INVALID_FORMAT', 'CN_INVALID_FORMAT'
    $content = $content -replace 'Invalid AWB', 'Invalid CN'
    $content = $content -replace 'INVALID_AWB', 'INVALID_CN'
    $content = $content -replace 'DUPLICATE_AWB', 'DUPLICATE_CN'
    $content = $content -replace "AWB `\$", "CN `$"
    $content = $content -replace "paste AWB", "paste CN"
    $content = $content -replace 'or type AWB', 'or type CN'
    $content = $content -replace 'AWB format', 'CN format'
    $content = $content -replace 'AWB must match', 'CN must match'

    # hook rename: step description
    $content = $content -replace "AWB & Booking", "CN & Booking"

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! UI labels updated."
