Write-Host ""
Write-Host "=== Ollama + LocalChat Toggle ==="
Write-Host ""

# Paths
$ollamaPath = "C:\Users\varun\AppData\Local\Programs\Ollama\ollama.exe"
$localChatPath = "d:\Projects\AI Experiments\LocalChat"

# Function to check if a process is running
function Is-ProcessRunning($name) {
    $proc = Get-Process -Name $name -ErrorAction SilentlyContinue
    return ($proc -ne $null)
}

# Function to check if a Docker container is running
function Is-ContainerRunning($name) {
    $status = docker ps --filter "name=$name" --filter "status=running" --format "{{.Names}}" 2>$null
    return ($status -eq $name)
}

$ollamaRunning = Is-ProcessRunning "ollama"
$localChatRunning = Is-ContainerRunning "localchat"

if ($ollamaRunning -or $localChatRunning) {
    Write-Host "Stopping all Ollama and LocalChat instances..."
    Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Ollama stopped."
    
    Write-Host "Stopping LocalChat and other containers..."
    docker stop localchat caddy searxng redis tts-stt-server
    Write-Host "Containers stopped."
    
    Write-Host "Stopping Docker Desktop..."
    Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Docker Desktop stopped."
} else {
    Write-Host "Starting Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
    Write-Host "Waiting for Docker to be ready..."
    Start-Sleep -Seconds 10
    
    Write-Host "Starting containers..."
    docker start caddy searxng redis tts-stt-server
    Write-Host "Containers started."
    
    Write-Host "Starting Ollama in background..."
    Start-Process $ollamaPath -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "Ollama started."

    Write-Host "Building and starting LocalChat..."
    Push-Location $localChatPath
    
    # Check if localchat container exists
    $containerExists = docker ps -a --filter "name=localchat" --format "{{.Names}}" 2>$null
    
    if ($containerExists -eq "localchat") {
        Write-Host "Starting existing LocalChat container..."
        docker start localchat
    } else {
        Write-Host "Building LocalChat Docker image..."
        docker build -t localchat .
        Write-Host "Starting LocalChat container..."
        docker run -d --name localchat -p 3001:3001 localchat
    }
    
    Pop-Location
    Write-Host "LocalChat started. Access at http://localhost:3001"
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
