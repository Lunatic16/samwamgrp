#!/bin/bash

# Samsung Speaker Controller - Service Script
# This script provides start, stop, and status functions for the Samsung Speaker Controller application

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
JAR_FILE="$PROJECT_DIR/target/controller-0.0.1-SNAPSHOT.jar"
PID_FILE="$PROJECT_DIR/controller.pid"
LOG_FILE="$PROJECT_DIR/controller.log"

# Function to print messages
print_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to check if application is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0  # Process is running
        else
            # Stale PID file, remove it
            rm -f "$PID_FILE"
        fi
    fi
    
    # Try to find the process by name
    PID=$(pgrep -f "java.*controller.*.jar" 2>/dev/null || true)
    if [ -n "$PID" ]; then
        return 0  # Process is running
    fi
    
    return 1  # Process is not running
}

# Function to start the application
start_app() {
    print_message "Starting Samsung Speaker Controller..."
    
    # Check if application is already running
    if is_running; then
        if [ -n "$PID" ]; then
            print_message "Samsung Speaker Controller is already running with PID: $PID"
        else
            # Try to get the PID again
            PID=$(pgrep -f "java.*controller.*.jar" 2>/dev/null || true)
            print_message "Samsung Speaker Controller is already running with PID: $PID"
        fi
        exit 1
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
}

# Function to stop the application
stop_app() {
    print_message "Stopping Samsung Speaker Controller..."
    
    # Check if PID file exists
    if [ ! -f "$PID_FILE" ]; then
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
}

# Function to show status
status_app() {
    if is_running; then
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            print_message "Samsung Speaker Controller is running with PID: $PID"
        else
            PID=$(pgrep -f "java.*controller.*.jar" 2>/dev/null || true)
            print_message "Samsung Speaker Controller is running with PID: $PID"
        fi
        print_message "Access the web UI at: http://localhost:8888"
    else
        print_message "Samsung Speaker Controller is not running"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    echo "  start   - Start the Samsung Speaker Controller"
    echo "  stop    - Stop the Samsung Speaker Controller"
    echo "  restart - Restart the Samsung Speaker Controller"
    echo "  status  - Show the status of the Samsung Speaker Controller"
    echo "  help    - Show this help message"
}

# Main script logic
case "${1:-help}" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 5
        start_app
        ;;
    status)
        status_app
        ;;
    help|"")
        show_usage
        ;;
    *)
        print_message "Invalid option: $1"
        show_usage
        exit 1
        ;;
esac

exit 0