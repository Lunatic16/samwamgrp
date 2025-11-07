#!/bin/bash

# Samsung Speaker Controller - Start Script
# This script starts the Samsung Speaker Controller web UI application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"  # Script is in the project root

JAR_FILE="$PROJECT_DIR/target/controller-0.0.1-SNAPSHOT.jar"
PID_FILE="$PROJECT_DIR/controller.pid"
LOG_FILE="$PROJECT_DIR/controller.log"

# Function to print messages
print_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if application is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        print_message "Samsung Speaker Controller is already running with PID: $PID"
        exit 1
    else
        # Stale PID file, remove it
        rm -f "$PID_FILE"
    fi
fi

# Check if JAR file exists
if [ ! -f "$JAR_FILE" ]; then
    print_message "JAR file not found: $JAR_FILE"
    print_message "Building the project first..."
    cd "$PROJECT_DIR"
    if ! mvn clean package -DskipTests; then
        print_message "Failed to build the project"
        exit 1
    fi
fi

print_message "Starting Samsung Speaker Controller..."

# Start the application in the background
cd "$PROJECT_DIR"
nohup java -jar "$JAR_FILE" > "$LOG_FILE" 2>&1 &
PID=$!

# Save the PID to file
echo $PID > "$PID_FILE"

# Wait a moment to see if the application starts successfully
sleep 5

# Check if the process is still running
if ps -p "$PID" > /dev/null 2>&1; then
    print_message "Samsung Speaker Controller started successfully with PID: $PID"
    print_message "Access the web UI at: http://localhost:8888"
    print_message "Check logs at: $LOG_FILE"
else
    print_message "Failed to start Samsung Speaker Controller"
    print_message "Check logs at: $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi