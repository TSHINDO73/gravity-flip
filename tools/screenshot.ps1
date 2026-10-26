param(
    [string]$Query = '',
    [Parameter(Mandatory = $true)][string]$Out,
    [int]$WaitMs = 3000
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$port = 8123
$server = Start-Process -FilePath python -ArgumentList '-m', 'http.server', $port -WorkingDirectory $root -WindowStyle Hidden -PassThru
try {
    $ready = $false
    for ($i = 0; $i -lt 50; $i++) {
        try {
            $c = New-Object System.Net.Sockets.TcpClient
            $c.Connect('127.0.0.1', $port)
            $c.Close()
            $ready = $true
            break
        } catch { Start-Sleep -Milliseconds 200 }
    }
    if (-not $ready) { throw 'server did not start' }
    # 毎回新しいプロファイルを使い、前回のキャッシュで古いファイルを読まないようにする
    $profileDir = Join-Path $env:TEMP ('gf-edge-shot-' + [guid]::NewGuid())
    $outFull = [System.IO.Path]::GetFullPath($Out)
    $edgeArgs = @('--headless', '--disable-gpu', "--user-data-dir=$profileDir", "--screenshot=$outFull", '--window-size=960,540', "--virtual-time-budget=$WaitMs", "http://localhost:$port/?$Query")
    Start-Process -FilePath $edge -ArgumentList $edgeArgs -Wait -WindowStyle Hidden
    Write-Output "saved: $outFull"
} finally {
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
    if ($profileDir -and (Test-Path $profileDir)) { Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue }
}

