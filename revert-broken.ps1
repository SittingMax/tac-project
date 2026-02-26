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

    # Revert broken destructuring/parameter renames
    # Pattern: (CN: string) should be (awb: string)
    # Pattern: { CN: ... } in object literals should be { awb: ... }
    # Pattern: function foo(CN: should be function foo(awb:

    # Revert function parameter names
    $content = $content -creplace '\(CN:', '(awb:'
    $content = $content -creplace '\(CN\b', '(awb'
    
    # Revert object property names (not in strings)
    # { CN: ... } -> { awb: ... }
    $content = $content -creplace '(?<=[{,]\s*)CN:', 'awb:'
    $content = $content -creplace '(?<=\s)CN:', 'awb:'
    
    # Revert destructured: { CN } -> { awb }  
    $content = $content -creplace '(?<=[{,]\s*)CN(?=[,}\s])', 'awb'
    
    # Revert property access: .CN -> .awb
    $content = $content -creplace '\.CN\b', '.awb'
    
    # Revert type property: CN: string; -> awb: string;
    $content = $content -creplace '^\s+CN:', '  awb:'
    
    # Fix: 'useInvoiceBy' + 'CN' should stay but 'byAwb' → 'byCN' was broken 
    # queryKeys: byAwb -> byCN was wrong, revert
    $content = $content -creplace '\.byCN\b', '.byAwb'
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "`nDone! Broken renames reverted."
