param(
    [string]$Version = '3.9.6',
    [string]$MvnArgs = '-DskipTests spring-boot:run'
)

# Ce script télécharge Apache Maven (portable) dans backend/.maven,
# met à jour PATH pour la session PowerShell et exécute mvn avec les arguments fournis.

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$mavenDir = Join-Path $scriptDir '..' | Resolve-Path | Select-Object -ExpandProperty Path
$mavenTarget = Join-Path $mavenDir '.maven'

if (-Not (Test-Path $mavenTarget)) {
    Write-Host "Téléchargement de Apache Maven $Version..."
    $zipName = "apache-maven-$Version-bin.zip"
    $downloadUrl = "https://dlcdn.apache.org/maven/maven-3/$Version/binaries/$zipName"
    $tmpZip = Join-Path $env:TEMP $zipName

    Write-Host "Téléchargement depuis plusieurs miroirs..."
    $candidates = @( 
        "https://dlcdn.apache.org/maven/maven-3/$Version/binaries/$zipName",
        "https://downloads.apache.org/maven/maven-3/$Version/binaries/$zipName",
        "https://archive.apache.org/dist/maven/maven-3/$Version/binaries/$zipName"
    )

    $downloaded = $false
    foreach ($u in $candidates) {
        try {
            Write-Host "  -> Essai: $u"
            Invoke-WebRequest -Uri $u -OutFile $tmpZip -UseBasicParsing -ErrorAction Stop
            $downloaded = $true
            break
        } catch {
            Write-Host "     échoué: $($_.Exception.Message)"
        }
    }

    if (-not $downloaded) {
        Write-Error "Échec du téléchargement de Maven depuis tous les miroirs. Vérifiez la connexion réseau ou téléchargez manuellement: https://archive.apache.org/dist/maven/maven-3/$Version/binaries/$zipName"
        exit 1
    }

    Write-Host "Extraction vers: $mavenTarget"
    Expand-Archive -Path $tmpZip -DestinationPath $mavenTarget

    # Déplace le contenu pour avoir .maven/bin
    $extracted = Join-Path $mavenTarget "apache-maven-$Version"
    Get-ChildItem -Path $extracted | ForEach-Object { Move-Item $_.FullName $mavenTarget }
    Remove-Item -Path $extracted -Recurse -Force
    Remove-Item -Path $tmpZip -Force
}

$mavenBin = Join-Path $mavenTarget 'bin'
if (-Not (Test-Path $mavenBin)) {
    Write-Error "Le répertoire Maven n'a pas été trouvé: $mavenBin"
    exit 1
}

# Ajoute Maven au PATH pour la session en cours
$env:PATH = "$mavenBin;$env:PATH"

Write-Host "Utilisation de Maven depuis: $mavenBin"
Write-Host "Exécution: mvn $MvnArgs"

# Split arguments into array so PowerShell passes them properly to mvn
$argsArray = @()
if ($MvnArgs -ne $null -and $MvnArgs -ne '') {
    $argsArray = $MvnArgs -split '\s+' | Where-Object { $_ -ne '' }
}

& mvn @argsArray
