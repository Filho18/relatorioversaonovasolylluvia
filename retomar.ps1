# Retoma o site: comenta a regra de pausa e o site volta a ser servido normalmente.
# Reverter: .\pausar.ps1

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$conteudo = @"
# KILL SWITCH - estado: ATIVO (site no ar)
#
# Para pausar:  .\pausar.ps1     (escreve a regra abaixo e faz push)
# Para retomar: .\retomar.ps1    (volta a comentar a regra e faz push)
#
# Regra de pausa (comentada enquanto o site esta no ar):
# /*  /manutencao.html  503!
"@

$destino = Join-Path $PSScriptRoot '_redirects'
$atual = if (Test-Path $destino) { Get-Content $destino -Raw } else { '' }

if ($atual.Trim() -eq $conteudo.Trim()) {
    Write-Host "O site ja esta no ar. Nada a fazer." -ForegroundColor Yellow
    exit 0
}

[System.IO.File]::WriteAllText($destino, $conteudo + "`n", (New-Object System.Text.UTF8Encoding($false)))

git add _redirects
git commit -m "chore: retomar site (fim da manutencao)"
if (-not $?) { Write-Host "Falhou o commit." -ForegroundColor Red; exit 1 }
git push origin main
if (-not $?) { Write-Host "Falhou o push - o site continua pausado." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Site NO AR. O Netlify redeploya em segundos." -ForegroundColor Green
Write-Host "Verificar: curl -I https://relatoriosolylluvia.netlify.app/  ->  espera 200"
