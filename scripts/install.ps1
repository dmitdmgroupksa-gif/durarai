# Durar Installer for Windows (PowerShell)
# Usage: iwr -useb https://Durar.ai/install.ps1 | iex
# Or: & ([scriptblock]::Create((iwr -useb https://Durar.ai/install.ps1))) -NoOnboard

param(
    [string]$InstallMethod = "npm",
    [string]$Tag = "latest",
    [string]$GitDir = "$env:USERPROFILE\Durar",
    [switch]$NoOnboard,
    [switch]$NoGitUpdate,
    [switch]$DryRun,
    [switch]$Verbose,
    [switch]$Verify
)

$ErrorActionPreference = "Stop"

# Colors
$ESC = if ($PSVersionTable.PSVersion.Major -ge 7) { "`e" } else { [char]27 }
$ACCENT = "$ESC[38;2;255;77;77m"    # coral-bright
$SUCCESS = "$ESC[38;2;0;229;204m"    # cyan-bright
$WARN = "$ESC[38;2;255;176;32m"     # amber
$ERR = "$ESC[38;2;230;57;70m"       # coral-mid
$MUTED = "$ESC[38;2;90;100;128m"    # text-muted
$NC = "$ESC[0m"                     # No Color

function Write-Host {
    param([string]$Message, [string]$Level = "info")
    $msg = switch ($Level) {
        "success" { "$SUCCESS✓$NC $Message" }
        "warn" { "$WARN!$NC $Message" }
        "error" { "$ERR✗$NC $Message" }
        default { "$MUTED·$NC $Message" }
    }
    Microsoft.PowerShell.Utility\Write-Host $msg
}

function Write-Banner {
    Write-Host ""
    Write-Host "${ACCENT}  🦞 Durar Installer$NC" -Level info
    Write-Host "${MUTED}  All your chats, one Durar.$NC" -Level info
    Write-Host ""
}

function Get-ExecutionPolicyStatus {
    $policy = Get-ExecutionPolicy
    if ($policy -eq "Restricted" -or $policy -eq "AllSigned") {
        return @{ Blocked = $true; Policy = $policy }
    }
    return @{ Blocked = $false; Policy = $policy }
}

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-ExecutionPolicy {
    $status = Get-ExecutionPolicyStatus
    if ($status.Blocked) {
        Write-Host "PowerShell execution policy is set to: $($status.Policy)" -Level warn
        Write-Host "This prevents scripts like npm.ps1 from running." -Level warn
        Write-Host ""
        
        # Try to set execution policy for current process
        try {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -ErrorAction Stop
            Write-Host "Set execution policy to RemoteSigned for current process" -Level success
            return $true
        } catch {
            Write-Host "Could not automatically set execution policy" -Level error
            Write-Host ""
            Write-Host "To fix this, run:" -Level info
            Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process" -Level info
            Write-Host ""
            Write-Host "Or run PowerShell as Administrator and execute:" -Level info
            Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine" -Level info
            return $false
        }
    }
    return $true
}

function Get-NodeVersion {
    try {
        $version = node --version 2>$null
        if ($version) {
            return $version -replace '^v', ''
        }
    } catch { }
    return $null
}

function Get-NpmVersion {
    try {
        $version = npm --version 2>$null
        if ($version) {
            return $version
        }
    } catch { }
    return $null
}

function Install-Node {
    Write-Host "Node.js not found" -Level info
    Write-Host "Installing Node.js..." -Level info
    
    # Try winget first
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "  Using winget..." -Level info
        try {
            winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Host "  Node.js installed via winget" -Level success
            return $true
        } catch {
            Write-Host "  Winget install failed: $_" -Level warn
        }
    }
    
    # Try chocolatey
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "  Using chocolatey..." -Level info
        try {
            choco install nodejs-lts -y 2>&1 | Out-Null
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Host "  Node.js installed via chocolatey" -Level success
            return $true
        } catch {
            Write-Host "  Chocolatey install failed: $_" -Level warn
        }
    }
    
    # Try scoop
    if (Get-Command scoop -ErrorAction SilentlyContinue) {
        Write-Host "  Using scoop..." -Level info
        try {
            scoop install nodejs-lts 2>&1 | Out-Null
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Host "  Node.js installed via scoop" -Level success
            return $true
        } catch {
            Write-Host "  Scoop install failed: $_" -Level warn
        }
    }
    
    Write-Host "Could not install Node.js automatically" -Level error
    Write-Host "Please install Node.js 22+ manually from: https://nodejs.org" -Level info
    return $false
}

function Ensure-Node {
    $nodeVersion = Get-NodeVersion
    if ($nodeVersion) {
        $major = [int]($nodeVersion -split '\.')[0]
        if ($major -ge 22) {
            Write-Host "Node.js v$nodeVersion found" -Level success
            return $true
        }
        Write-Host "Node.js v$nodeVersion found, but need v22+" -Level warn
    }
    return Install-Node
}

function Get-GitVersion {
    try {
        $version = git --version 2>$null
        if ($version) {
            return $version
        }
    } catch { }
    return $null
}

function Install-Git {
    Write-Host "Git not found" -Level info
    
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "  Installing Git via winget..." -Level info
        try {
            winget install Git.Git --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Host "  Git installed" -Level success
            return $true
        } catch {
            Write-Host "  Winget install failed" -Level warn
        }
    }
    
    Write-Host "Please install Git for Windows from: https://git-scm.com" -Level error
    return $false
}

function Ensure-Git {
    $gitVersion = Get-GitVersion
    if ($gitVersion) {
        Write-Host "$gitVersion found" -Level success
        return $true
    }
    return Install-Git
}

function Install-DurarNpm {
    param([string]$Target = "latest")

    $installSpec = Resolve-PackageInstallSpec -Target $Target
    
    Write-Host "Installing Durar ($installSpec)..." -Level info
    
    # Find npm.cmd explicitly (Start-Process on Windows needs the .cmd extension)
    $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (!$npmCmd) {
        $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    }
    if (!$npmCmd) {
        Write-Host "npm not found" -Level error
        return $false
    }
    $npmPath = $npmCmd.Source
    
    # Use temp log files like the bash installer. In verbose mode, output is
    # shown to the user. In silent mode, output goes to log files for diagnostics.
    $logFile = Join-Path $env:TEMP "durar-npm-install-$((Get-Date).ToString('yyyyMMdd-HHmmss')).log"
    $errFile = Join-Path $env:TEMP "durar-npm-install-$((Get-Date).ToString('yyyyMMdd-HHmmss'))-err.log"
    
    if ($Verbose) {
        # Verbose mode: show npm output in real-time (loglevel error suppresses warnings)
        & $npmPath --loglevel error install -g $installSpec --no-fund --no-audit 2>&1
        $exitCode = $LASTEXITCODE
    } else {
        # Silent mode: redirect to log files
        $process = Start-Process -FilePath $npmPath -ArgumentList "install", "-g", $installSpec, "--no-fund", "--no-audit" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $errFile
        $exitCode = $process.ExitCode
    }
    
    if ($exitCode -ne 0) {
        # Handle common npm failure patterns with automatic retries
        $errContent = if (Test-Path $errFile) { Get-Content $errFile -Raw } else { "" }
        $logContent = if (Test-Path $logFile) { Get-Content $logFile -Raw } else { "" }
        $combinedError = "$errContent`n$logContent"
        
        # ENOTEMPTY: npm left a stale directory
        if ($combinedError -match "ENOTEMPTY.*Durar") {
            Write-Host "npm left a stale directory; cleaning and retrying..." -Level warn
            Cleanup-NpmDurarPaths
            if ($Verbose) {
                & $npmPath --loglevel error install -g $installSpec --no-fund --no-audit 2>&1
                $exitCode = $LASTEXITCODE
            } else {
                $process2 = Start-Process -FilePath $npmPath -ArgumentList "install", "-g", $installSpec, "--no-fund", "--no-audit" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $errFile
                $exitCode = $process2.ExitCode
            }
            if ($exitCode -eq 0) {
                Write-Host "Durar installed (after cleanup retry)" -Level success
                return $true
            }
        }
        
        # EEXIST: binary conflict
        if ($combinedError -match "EEXIST") {
            Write-Host "npm failed due to a binary conflict; attempting cleanup..." -Level warn
            if (Cleanup-DurarBinConflict) {
                if ($Verbose) {
                    & $npmPath --loglevel error install -g $installSpec --no-fund --no-audit 2>&1
                    $exitCode = $LASTEXITCODE
                } else {
                    $process3 = Start-Process -FilePath $npmPath -ArgumentList "install", "-g", $installSpec, "--no-fund", "--no-audit" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $errFile
                    $exitCode = $process3.ExitCode
                }
                if ($exitCode -eq 0) {
                    Write-Host "Durar installed (after conflict cleanup)" -Level success
                    return $true
                }
            }
        }
        
        Write-Host "npm install failed (exit code $exitCode)" -Level error
        if (!$Verbose -and (Test-Path $logFile)) {
            Write-Host "Showing last 20 lines of install log:" -Level warn
            Get-Content $logFile -Tail 20 | ForEach-Object { Write-Host $_ -Level error }
        }
        return $false
    }
    
    # Post-install verification: check the package is actually installed
    try {
        $pkgName = $installSpec.Split("@")[0]
        $checkOutput = npm list -g $pkgName --depth=0 2>&1
        if ($checkOutput -match "empty" -or $checkOutput -match "ERR!") {
            Write-Host "npm install completed but package verification failed" -Level error
            Write-Host "Attempting cleanup and retry..." -Level warn
            npm uninstall -g $pkgName 2>$null | Out-Null
            npm cache clean --force 2>$null | Out-Null
            
            $logFile2 = Join-Path $env:TEMP "durar-npm-install-retry-$((Get-Date).ToString('yyyyMMdd-HHmmss')).log"
            $errFile2 = Join-Path $env:TEMP "durar-npm-install-retry-$((Get-Date).ToString('yyyyMMdd-HHmmss'))-err.log"
            if ($Verbose) {
                & $npmPath --loglevel error install -g $installSpec --no-fund --no-audit 2>&1
                $exitCode2 = $LASTEXITCODE
            } else {
                $process4 = Start-Process -FilePath $npmPath -ArgumentList "install", "-g", $installSpec, "--no-fund", "--no-audit" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $logFile2 -RedirectStandardError $errFile2
                $exitCode2 = $process4.ExitCode
            }
            
            if ($exitCode2 -ne 0) {
                Write-Host "npm install retry failed (exit code $exitCode2)" -Level error
                return $false
            }
        }
    } catch { }
    
    Write-Host "Durar installed" -Level success
    return $true
}

function Cleanup-NpmDurarPaths {
    $npmPrefix = npm config get prefix 2>$null
    if ($npmPrefix) {
        $stalePaths = @(
            "$npmPrefix\node_modules\durar-cli",
            "$npmPrefix\node_modules\.cache\durar-cli"
        )
        foreach ($path in $stalePaths) {
            if (Test-Path $path) {
                try {
                    Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
                } catch { }
            }
        }
    }
}

function Cleanup-DurarBinConflict {
    $npmPrefix = npm config get prefix 2>$null
    if (!$npmPrefix) { return $false }
    
    $conflictFiles = @("$npmPrefix\durar", "$npmPrefix\durar.cmd", "$npmPrefix\durar.ps1")
    $cleaned = $false
    foreach ($file in $conflictFiles) {
        if (Test-Path $file) {
            try {
                Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
                $cleaned = $true
            } catch {
                Write-Host "  Could not remove $file (may need admin)" -Level warn
            }
        }
    }
    return $cleaned
}

function Install-DurarGit {
    param([string]$RepoDir, [switch]$Update)
    
    Write-Host "Installing Durar from git..." -Level info
    
    if (!(Test-Path $RepoDir)) {
        Write-Host "  Cloning repository..." -Level info
        git clone https://github.com/dmitdmgroupksa-gif/durarai.git $RepoDir 2>&1
    } elseif ($Update) {
        Write-Host "  Updating repository..." -Level info
        git -C $RepoDir pull --rebase 2>&1
    }
    
    # Install pnpm if not present
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "  Installing pnpm..." -Level info
        npm install -g pnpm 2>&1
    }
    
    # Install dependencies
    Write-Host "  Installing dependencies..." -Level info
    pnpm install --dir $RepoDir 2>&1
    
    # Build
    Write-Host "  Building..." -Level info
    pnpm --dir $RepoDir build 2>&1
    
    # Create wrapper
    $wrapperDir = "$env:USERPROFILE\.local\bin"
    if (!(Test-Path $wrapperDir)) {
        New-Item -ItemType Directory -Path $wrapperDir -Force | Out-Null
    }
    
    @"
@echo off
node "%~dp0..\Durar\dist\entry.js" %*
"@ | Out-File -FilePath "$wrapperDir\Durar.cmd" -Encoding ASCII -Force
    
    Write-Host "Durar installed" -Level success
    return $true
}

function Test-ExplicitPackageInstallSpec {
    param([string]$Target)

    if ([string]::IsNullOrWhiteSpace($Target)) {
        return $false
    }

    return $Target.Contains("://") -or
        $Target.Contains("#") -or
        $Target -match '^(file|github|git\+ssh|git\+https|git\+http|git\+file|npm):'
}

function Resolve-PackageInstallSpec {
    param([string]$Target = "latest")

    $trimmed = $Target.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        return "durar-cli@latest"
    }
    if ($trimmed.ToLowerInvariant() -eq "main") {
        return "github:dmitdmgroupksa-gif/durarai#main"
    }
    if (Test-ExplicitPackageInstallSpec -Target $trimmed) {
        return $trimmed
    }
    return "durar-cli@$trimmed"
}

function Add-ToPath {
    param([string]$Path)
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$Path*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$Path", "User")
        Write-Host "Added $Path to user PATH" -Level info
    }
}

function Verify-Installation {
    Write-Host "Verifying installation..." -Level info
    
    $durarCmd = Get-Command durar -ErrorAction SilentlyContinue
    if (!$durarCmd) {
        $durarCmd = Get-Command Durar -ErrorAction SilentlyContinue
    }
    if (!$durarCmd) {
        Write-Host "durar binary not found in PATH" -Level error
        $npmPrefix = npm config get prefix 2>$null
        if ($npmPrefix) {
            Write-Host "  npm global bin: $npmPrefix" -Level info
            Write-Host "  Add it to PATH or restart your terminal" -Level warn
        }
        return $false
    }
    
    # Run durar --help to confirm the binary works
    try {
        $helpOutput = & $durarCmd.Source --help 2>&1
        if ($helpOutput) {
            Write-Host "durar binary verified and responds to --help" -Level success
        } else {
            Write-Host "durar binary found but --help returned empty" -Level warn
        }
        return $true
    } catch {
        Write-Host "durar --help failed: $_" -Level error
        return $false
    }
}

function Refresh-GatewayService {
    Write-Host "Checking for running gateway..." -Level info
    
    $gatewayProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match "durar.*gateway" -or $_.CommandLine -match "Durar.*gateway"
    }
    
    if ($gatewayProcesses) {
        Write-Host "Stopping running gateway processes..." -Level warn
        foreach ($proc in $gatewayProcesses) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            } catch { }
        }
        Write-Host "Gateway stopped (will restart on next 'Durar gateway run')" -Level success
    } else {
        Write-Host "No running gateway found" -Level info
    }
}

# Main
function Main {
    Write-Banner
    
    Write-Host "Windows detected" -Level success
    
    # Check and handle execution policy FIRST, before any npm calls
    if (!(Ensure-ExecutionPolicy)) {
        Write-Host ""
        Write-Host "Installation cannot continue due to execution policy restrictions" -Level error
        exit 1
    }
    
    if (!(Ensure-Node)) {
        exit 1
    }
    
    if ($InstallMethod -eq "git") {
        if (!(Ensure-Git)) {
            exit 1
        }
        
        if ($DryRun) {
            Write-Host "[DRY RUN] Would install Durar from git to $GitDir" -Level info
        } else {
            Install-DurarGit -RepoDir $GitDir -Update:(-not $NoGitUpdate)
        }
    } else {
        # npm method
        if (!(Ensure-Git)) {
            Write-Host "Git is required for npm installs. Please install Git and try again." -Level warn
            exit 1
        }
        
        if ($DryRun) {
            Write-Host "[DRY RUN] Would install Durar via npm ($((Resolve-PackageInstallSpec -Target $Tag)))" -Level info
        } else {
            if (!(Install-DurarNpm -Target $Tag)) {
                exit 1
            }
        }
    }
    
    # Try to add npm global bin to PATH
    try {
        $npmPrefix = npm config get prefix 2>$null
        if ($npmPrefix) {
            Add-ToPath -Path "$npmPrefix"
        }
    } catch { }
    
    # Verify installation if --verify flag is set (or by default on fresh installs)
    if ($Verify -or !$DryRun) {
        Verify-Installation
    }
    
    # Refresh gateway service for upgrades
    if (!$DryRun) {
        Refresh-GatewayService
    }
    
    if (!$NoOnboard -and !$DryRun) {
        Write-Host ""
        Write-Host "Run 'Durar onboard' to complete setup" -Level info
    }
    
    Write-Host ""
    Write-Host "🦞 Durar installed successfully!" -Level success
}

Main
