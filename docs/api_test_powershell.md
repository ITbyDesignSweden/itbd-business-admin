# API Testing i PowerShell

## PowerShell-kommandon för att testa API:et

### Metod 1: Invoke-RestMethod (Rekommenderat)

```powershell
$apiKey = "itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y"
$headers = @{
    "Authorization" = "Bearer $apiKey"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers -Method Get
```

### Metod 2: Invoke-WebRequest (mer detaljer)

```powershell
$apiKey = "itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y"
$headers = @{
    "Authorization" = "Bearer $apiKey"
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/credits" -Headers $headers -Method Get
$response.Content | ConvertFrom-Json
```

### Metod 3: curl.exe (Native curl i Windows)

```powershell
curl.exe -X GET http://localhost:3000/api/v1/credits `
  -H "Authorization: Bearer itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y"
```

**OBS:** Lägg märke till backtick `` ` `` för multiline i PowerShell (inte `\` som i Bash)

### Metod 4: Ett-rads kommando (enklast)

```powershell
curl.exe -H "Authorization: Bearer itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y" http://localhost:3000/api/v1/credits
```

## Testa olika scenarios

### 1. Lyckad request

```powershell
$apiKey = "itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y"
$headers = @{ "Authorization" = "Bearer $apiKey" }
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers
```

### 2. Ogiltig API-nyckel

```powershell
$headers = @{ "Authorization" = "Bearer invalid_key_123" }
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers
} catch {
    Write-Host "Fel: $($_.Exception.Message)"
    $_.Exception.Response | Select-Object StatusCode, StatusDescription
}
```

### 3. Saknad Authorization header

```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits"
} catch {
    Write-Host "Fel: $($_.Exception.Message)"
}
```

### 4. Test med felhantering

```powershell
function Test-CreditsAPI {
    param(
        [string]$ApiKey = "itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y"
    )
    
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
    }
    
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers -Method Get
        
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "Credits: $($result.credits)"
        Write-Host "Plan: $($result.plan)"
        Write-Host "Status: $($result.status)"
        Write-Host "Subscription Status: $($result.subscription_status)"
        
        return $result
    }
    catch {
        Write-Host "❌ Error!" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Message: $($_.Exception.Message)"
        
        if ($_.ErrorDetails.Message) {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Error Details: $($errorBody.error)"
            Write-Host "Message: $($errorBody.message)"
        }
    }
}

# Kör testet
Test-CreditsAPI
```

## Tips för PowerShell

### Spara API-nyckel som miljövariabel

```powershell
# Sätt variabeln (gäller för denna session)
$env:ITBD_API_KEY = "itbd_uc5u4rRh0gJ28aOCCZJlYkDSrWi9GHOzW3L6kS0ye4Y"

# Använd den
$headers = @{ "Authorization" = "Bearer $env:ITBD_API_KEY" }
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers
```

### Pretty print JSON

```powershell
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers
$result | ConvertTo-Json -Depth 10
```

### Mät svarstid

```powershell
Measure-Command {
    Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credits" -Headers $headers
}
```

