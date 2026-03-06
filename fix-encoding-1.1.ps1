param(
  [switch]$Apply,
  [string]$Root = "H:\Weboldal"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$latin1 = [System.Text.Encoding]::GetEncoding(28591)
$cp1250 = [System.Text.Encoding]::GetEncoding(1250)

function Test-HasSuspicious([string]$s) {
  foreach ($code in @(0x00C2, 0x00C3, 0x00C4, 0x00C5, 0x00E2)) {
    if ($s.IndexOf([char]$code) -ge 0) { return $true }
  }
  return $false
}

function Get-BadScore([string]$s) {
  $score = 0
  foreach ($code in @(0x00C2, 0x00C3, 0x00C4, 0x00C5, 0x00E2, 0xFFFD)) {
    $ch = [char]$code
    $i = 0
    while (($i = $s.IndexOf($ch, $i)) -ge 0) {
      $score++
      $i++
    }
  }
  return $score
}

function Convert-Through([string]$s, [System.Text.Encoding]$sourceEncoding) {
  $bytes = $sourceEncoding.GetBytes($s)
  return [System.Text.Encoding]::UTF8.GetString($bytes)
}

$files = Get-ChildItem -Path $Root -Recurse -File -Include *.html,*.css,*.js |
  Where-Object { $_.FullName -notmatch '\\.git\\|\\node_modules\\' }

$changed = @()

foreach ($f in $files) {
  $raw = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $best = $raw
  $bestScore = Get-BadScore $raw

  if (Test-HasSuspicious $raw) {
    foreach ($enc in @($latin1, $cp1250)) {
      $cand = Convert-Through -s $raw -sourceEncoding $enc
      $candScore = Get-BadScore $cand
      if ($candScore -lt $bestScore) {
        $best = $cand
        $bestScore = $candScore
      }
    }
  }

  if ($best -ne $raw) {
    $changed += $f.FullName
    if ($Apply) {
      [System.IO.File]::WriteAllText($f.FullName, $best, $utf8NoBom)
    }
  }
}

if ($changed.Count -eq 0) {
  Write-Host "No files need fixing."
} else {
  Write-Host ("Files changed: " + $changed.Count)
  $changed | ForEach-Object { Write-Host $_ }
  if (-not $Apply) {
    Write-Host ""
    Write-Host "Dry run only. Re-run with -Apply to write changes."
  }
}
