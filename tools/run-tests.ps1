$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$port = 8123
$server = Start-Process -FilePath python -ArgumentList '-m', 'http.server', $port -WorkingDirectory $root -WindowStyle Hidden -PassThru
$exit = 1
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
    $profileDir = Join-Path $env:TEMP ('gf-edge-test-' + [guid]::NewGuid())
    $dom = & $edge --headless --disable-gpu "--user-data-dir=$profileDir" --dump-dom --virtual-time-budget=5000 "http://localhost:$port/tests/" 2>$null | Out-String
    $m = [regex]::Match($dom, '(?s)<pre id="summary">(SUMMARY passed=(\d+) failed=(\d+))</pre>\s*<pre id="details">(.*?)</pre>')
    if (-not $m.Success) {
        Write-Output 'SUMMARY line not found (test page failed to load or run)'
    } else {
        Write-Output $m.Groups[1].Value
        $details = [System.Net.WebUtility]::HtmlDecode($m.Groups[4].Value).Trim()
        if ($details) { Write-Output $details }
        if ([int]$m.Groups[3].Value -eq 0) { $exit = 0 }
    }
} finally {
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
    if ($profileDir -and (Test-Path $profileDir)) { Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue }
}
exit $exit
