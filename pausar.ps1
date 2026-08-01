# Pausa o site: tudo passa a servir manutencao.html com HTTP 503.
# O conteudo do site nao e apagado nem alterado - so deixa de ser servido.
# Reverter: .\retomar.ps1

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$conteudo = @"
# KILL SWITCH - estado: PAUSADO (site em manutencao)
#
# Para retomar: .\retomar.ps1
#
/*  /manutencao.html  503!
"@

$destino = Join-Path $PSScriptRoot '_redirects'
$atual = if (Test-Path $destino) { Get-Content $destino -Raw } else { '' }

if ($atual.Trim() -eq $conteudo.Trim()) {
    Write-Host "O site ja esta pausado. Nada a fazer." -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($destino, $conteudo + "`n", (New-Object System.Text.UTF8Encoding($false)))

git add _redirects manutencao.html
git commit -m "chore: pausar site (manutencao 503)"
if (-not $?) { Write-Host "Falhou o commit." -ForegroundColor Red; exit 1 }
git push origin main
if (-not $?) { Write-Host "Falhou o push - o site continua no ar." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Site PAUSADO. O Netlify redeploya em segundos." -ForegroundColor Cyan
Write-Host "Verificar: curl -I https://relatoriosolylluvia.netlify.app/  ->  espera 503"
Write-Host "Retomar:   .\retomar.ps1"
