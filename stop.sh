#!/bin/bash

# Samsung Speaker Controller - Stop Script
# This script stops the Samsung Speaker Controller web UI application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"  # Script is in the project root

PID_FILE="$PROJECT_DIR/controller.pid"

# Function to print messages
print_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    print_message "PID file not found. The application may not be running."
    print_message "Checking for running processes..."
    
    # Try to find the process by name
    PIDS=$(pgrep -f "java.*controller.*.jar" || true)
    
    if [ -z "$PIDS" ]; then
        print_message "No Samsung Speaker Controller processes found."
        exit 0
    else
        print_message "Found processes: $PIDS"
        for PID in $PIDS; do
            kill -TERM "$PID" 2>/dev/null || kill -KILL "$PID" 2>/dev/null
            if [ $? -eq 0 ]; then
                print_message "Sent termination signal to process $PID"
            else
                print_message "Failed to terminate process $PID"
            fi
        done
        print_message "Waiting for processes to stop..."
        sleep 3
    fi
else
    PID=$(cat "$PID_FILE")
    
    # Check if the process is still running
    if ps -p "$PID" > /dev/null 2>&1; then
        print_message "Stopping Samsung Speaker Controller (PID: $PID)..."
        
        # Try graceful shutdown first
        kill -TERM "$PID" 2>/dev/null || kill -KILL "$PID" 2>/dev/null
        if [ $? -eq 0 ]; then
            print_message "Sent termination signal to process $PID"
        else
            print_message "Failed to terminate process $PID"
        fi
    else
        print_message "Process with PID $PID is not running."
        print_message "Checking for any Samsung Speaker Controller processes..."
        
        # Try to find the process by name
        PIDS=$(pgrep -f "java.*controller.*.jar" || true)
        
        if [ -z "$PIDS" ]; then
            print_message "No Samsung Speaker Controller processes found."
        else
            print_message "Found processes: $PIDS"
            for PID in $PIDS; do
                kill -TERM "$PID" 2>/dev/null || kill -KILL "$PID" 2>/dev/null
                if [ $? -eq 0 ]; then
                    print_message "Sent termination signal to process $PID"
                else
                    print_message "Failed to terminate process $PID"
                fi
            done
            print_message "Waiting for processes to stop..."
            sleep 3
        fi
    fi
    
    # Remove the PID file
    rm -f "$PID_FILE"
fi

print_message "Samsung Speaker Controller stop process completed."