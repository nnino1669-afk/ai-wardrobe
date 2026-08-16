# AI Wardrobe Local Repair Script for Windows PowerShell
Write-Host "Starting AI Wardrobe local runtime repair..." -ForegroundColor Cyan

# 1. Patch server/_core/sdk.ts constructor error/warning logging
$sdkPath = "server/_core/sdk.ts"
if (Test-Path $sdkPath) {
    $content = Get-Content $sdkPath -Raw
    $oldBlock = @"
  constructor(private client: ReturnType<typeof axios.create>) {
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.warn(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
"@
    $newBlock = @"
  constructor(private client: ReturnType<typeof axios.create>) {
    if (ENV.oAuthServerUrl) {
      console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    } else {
      console.log("[OAuth] Running in local offline mode (OAUTH_SERVER_URL not configured). Using local dev auth bypass.");
    }
  }
"@
    if ($content -match "ERROR: OAUTH_SERVER_URL is not configured") {
        $content = $content.Replace($oldBlock, $newBlock)
        Set-Content $sdkPath $content -Encoding UTF8
        Write-Host "Patched server/_core/sdk.ts successfully." -ForegroundColor Green
    } else {
        Write-Host "server/_core/sdk.ts already patched or structure differs." -ForegroundColor Yellow
    }
} else {
    Write-Warning "Could not find server/_core/sdk.ts"
}

# 2. Patch client/src/main.tsx to remove analytics injection completely
$mainPath = "client/src/main.tsx"
if (Test-Path $mainPath) {
    $mainContent = Get-Content $mainPath -Raw
    # Remove analytics snippet if present
    if ($mainContent -match "VITE_ANALYTICS") {
        $cleanMain = [System.Text.RegularExpressions.Regex]::Replace($mainContent, 'const analyticsEndpoint[\s\S]*?document\.head\.appendChild\(script\);\s*\}', '// Analytics injection removed for local offline stability')
        Set-Content $mainPath $cleanMain -Encoding UTF8
        Write-Host "Patched client/src/main.tsx successfully." -ForegroundColor Green
    } else {
        Write-Host "client/src/main.tsx already clean of analytics." -ForegroundColor Yellow
    }
} else {
    Write-Warning "Could not find client/src/main.tsx"
}

Write-Host "Local repair completed successfully! Now run 'pnpm dev'." -ForegroundColor Green
