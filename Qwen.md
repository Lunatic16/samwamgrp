# Samsung Speaker Controller - Qwen Documentation

This document provides comprehensive information about the Samsung Speaker Controller project for Qwen AI assistants working with this codebase.

## Project Overview

The Samsung Speaker Controller is a Spring Boot application that enables control of Samsung wireless audio speakers, with focus on grouping and ungrouping functionality. The application discovers speakers via mDNS (multicast DNS) and provides both REST API and Web UI for managing speaker groups.

## Project Structure

```
SamsungSpeakerController/
├── config/                           # Configuration files
│   └── application.properties        # Application configuration
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/kajahla/speakers/samsung/controller/
│   │   │       ├── ControllerApplication.java     # Main Spring Boot application
│   │   │       ├── SpeakerController.java         # Core API endpoints and discovery logic
│   │   │       ├── WebUIController.java           # Web UI endpoints
│   │   │       └── model/
│   │   │           ├── GroupInfo.java             # Group information model
│   │   │           ├── SpeakerInfo.java           # Speaker information model
│   │   │           └── SpeakerList.java           # Speaker list model
│   │   └── resources/
│   │       └── static/                           # Web UI files
│   │           ├── index.html                    # Main web interface
│   │           ├── style.css                     # Web UI styling
│   │           └── script.js                     # Web UI JavaScript
│   └── test/
├── controller.sh                     # Controller script (start/stop/status with auto-build)
├── pom.xml                           # Maven configuration
└── README.md                         # User documentation
```

## Core Components

### Speaker Discovery (mDNS)
- Uses JmDNS library to discover Samsung speakers on the network via mDNS service discovery
- Discovers services of type `_spotify-connect._tcp.local.` which Samsung speakers typically broadcast
- Discovery process runs for 30 seconds on application startup to identify available speakers
- Speakers are stored in an in-memory map with their name, IP, port, and MAC address

### REST API Endpoints
- `GET /speakers` - Returns list of currently discovered speakers
- `POST /group` - Create a group of speakers (expects JSON payload with speaker names)
- `GET /ungroup` - Ungroup speakers (with optional `group_name` parameter)
- `POST /addSpeaker` - Manually add a speaker by IP address (with optional name parameter)

### Web UI
- Modern, responsive interface built with Bootstrap 5
- Tabular display of discovered speakers with Name, IP, Port, MAC, and Model information
- Multi-select dropdown for grouping speakers
- Manual speaker addition by IP address
- Right-positioned ungroup speakers section
- Real-time system status monitoring

## Key Features

### Speaker Grouping
- Allows grouping multiple Samsung speakers together for synchronized playback
- Uses Samsung's proprietary protocol to communicate with speakers
- Each group has a master speaker that coordinates the group activities

### Speaker Ungrouping
- Ability to remove speakers from existing groups
- Option to ungroup all speakers at once
- Uses the master speaker to send ungroup commands to all group members

### Manual Speaker Addition
- Option to manually add speakers by IP address
- Automatically verifies if the specified IP corresponds to a genuine Samsung speaker
- Retrieves device information and adds it to the available speakers list

### Enhanced UI Features
- Table-based speaker listing with comprehensive information
- Dropdown-based speaker selection for grouping
- Improved layout with ungroup section on the right side
- 30-second discovery interval for more thorough speaker scanning

## Technical Details

### Discovery Process
1. On startup, the application begins listening for mDNS advertisements
2. When a Samsung speaker is discovered, the application contacts it directly
3. It sends a `GetApInfo` command to the speaker's API
4. Parses the response to extract name, MAC address, and other details
5. Verifies it's not a duplicate before adding to the speakers list
6. The discovery process runs for 30 seconds to ensure all speakers are found

### Group Communication Flow
1. When creating a group, the first selected speaker becomes the "master"
2. A complex XML command is constructed that specifies all speaker details
3. The command is sent to the master speaker using Samsung's proprietary protocol
4. The master speaker coordinates the grouping of all specified speakers

### Speaker Communication Protocol
- Uses HTTP GET requests to communicate with speakers on port 55001
- Constructs XML command strings wrapped in Samsung's specific format
- Has custom URL encoding (percentEncode method) to match Samsung speaker expectations

## Important Notes for Development

1. This application uses a custom implementation to communicate with Samsung speakers
2. The protocol implementation is reverse-engineered and may not work with all Samsung speaker models
3. Speaker discovery relies on mDNS which requires speakers to be on the same local network
4. The application stores speaker data in memory only - it's not persistent across restarts
5. The UI now displays speakers in a table format with Name, IP, Port, MAC, and Model columns
6. Speaker selection for grouping is now done through a dropdown rather than checkboxes
7. The discovery scan time has been increased to 30 seconds for better coverage

## Troubleshooting

### Common Issues
1. **No speakers discovered**: Ensure Samsung speakers are on the same network and mDNS is enabled
2. **Error connecting to speakers**: Samsung speakers may have changed their API or require authentication
3. **Grouping failures**: Check if all speakers in the group are powered on and accessible
4. **UI not loading**: Verify that static files are in the correct location (src/main/resources/static/)

### API Response Format
- Successful responses return JSON objects with status and relevant data
- Error responses return appropriate HTTP status codes with error messages

## Dependencies

- Spring Boot 2.7.18
- JmDNS for service discovery
- Java 11+ 
- Maven for build management
- Bootstrap 5 (for Web UI)

## Development Guidelines

When extending this application:
1. Follow the existing code patterns for speaker communication
2. Maintain the in-memory storage approach unless persistence is specifically required
3. Keep backward compatibility with existing API endpoints
4. Test thoroughly with actual Samsung speakers before deploying
5. Consider adding error handling for network timeouts and unreachable speakers

## Files to Focus On

- `SpeakerController.java` - Contains the core discovery logic and API endpoints
- `SpeakerInfo.java` - Defines the speaker data model
- `index.html` - Main web interface structure
- `style.css` - Web UI styling 
- `script.js` - Web UI JavaScript functionality
- `ControllerApplication.java` - Main Spring Boot entry point