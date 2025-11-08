// Samsung Speaker Controller Web UI
class SpeakerControllerUI {
    constructor() {
        this.apiBaseUrl = `http://localhost:8888`;
        this.speakers = {};
        this.selectedSpeakers = new Set();
        
        this.initializeElements();
        this.bindEvents();
        this.checkConnection();
        this.loadSpeakers();
    }
    
    initializeElements() {
        this.refreshBtn = document.getElementById('refresh-btn');
        this.speakersContainer = document.getElementById('speakers-container');
        this.groupSpeakersContainer = document.getElementById('group-speakers-container');
        this.groupNameInput = document.getElementById('group-name');
        this.createGroupBtn = document.getElementById('create-group-btn');
        this.selectGroup = document.getElementById('select-group');
        this.ungroupBtn = document.getElementById('ungroup-btn');
        this.responseContainer = document.getElementById('response-container');
        this.statusText = document.getElementById('status-text');
        this.statusIndicator = document.getElementById('status-indicator');
    }
    
    bindEvents() {
        this.refreshBtn.addEventListener('click', () => this.loadSpeakers());
        this.createGroupBtn.addEventListener('click', () => this.createGroup());
        this.ungroupBtn.addEventListener('click', () => this.ungroup());
    }
    
    async checkConnection() {
        try {
            // Check if the API is reachable by fetching speakers
            const response = await fetch(`${this.apiBaseUrl}/speakers`);
            if (response.ok) {
                this.updateStatus(true, 'Connected');
            } else {
                this.updateStatus(false, 'Connection Error');
            }
        } catch (error) {
            this.updateStatus(false, 'Server Unreachable');
        }
    }
    
    updateStatus(connected, message) {
        this.statusText.textContent = message;
        this.statusIndicator.className = 'status-dot';
        if (connected) {
            this.statusIndicator.classList.add('connected');
        } else {
            this.statusIndicator.classList.add('disconnected');
        }
    }
    
    async loadSpeakers() {
        this.showLoading(this.speakersContainer);
        this.showLoading(this.groupSpeakersContainer);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/speakers`);
            const speakers = await response.json();
            
            this.speakers = {};
            speakers.forEach(speaker => {
                this.speakers[speaker.name] = speaker;
            });
            
            this.displaySpeakers();
        } catch (error) {
            console.error('Error loading speakers:', error);
            this.showError('Error loading speakers: ' + error.message, this.speakersContainer);
            this.showError('Error loading speakers: ' + error.message, this.groupSpeakersContainer);
        }
    }
    
    showLoading(container) {
        container.innerHTML = '<p class="loading">Loading speakers...</p>';
    }
    
    showError(message, container) {
        container.innerHTML = `<p class="error">${message}</p>`;
    }
    
    displaySpeakers() {
        // Display speakers in the main speakers section
        let speakerCards = '';
        if (Object.keys(this.speakers).length === 0) {
            speakerCards = '<p class="loading">No speakers discovered yet. Speakers will appear here when discovered via mDNS.</p>';
        } else {
            speakerCards = Object.values(this.speakers).map(speaker => `
                <div class="speaker-card">
                    <h3>${this.escapeHtml(speaker.name)}</h3>
                    <div class="speaker-details">
                        <p><strong>IP:</strong> ${this.escapeHtml(speaker.ip)}</p>
                        <p><strong>Port:</strong> ${this.escapeHtml(speaker.port)}</p>
                        <p><strong>MAC:</strong> ${this.escapeHtml(speaker.mac)}</p>
                        <p><strong>Model:</strong> ${this.escapeHtml(speaker.model || 'Samsung Speaker')}</p>
                        ${speaker.groupName ? `<p><strong>Group:</strong> ${this.escapeHtml(speaker.groupName)}</p>` : ''}
                    </div>
                </div>
            `).join('');
        }
        
        this.speakersContainer.innerHTML = speakerCards;
        
        // Display speakers in the group selection section
        if (Object.keys(this.speakers).length === 0) {
            this.groupSpeakersContainer.innerHTML = '<p class="loading">No speakers discovered yet. Speakers will appear here for grouping.</p>';
        } else {
            const speakerCheckboxes = Object.values(this.speakers).map(speaker => `
                <div class="speaker-checkbox">
                    <input type="checkbox" id="chk_${this.escapeHtml(speaker.name)}" value="${this.escapeHtml(speaker.name)}" 
                        onchange="speakerUI.toggleSpeakerSelection('${this.escapeHtml(speaker.name)}')">
                    <label for="chk_${this.escapeHtml(speaker.name)}">
                        <strong>${this.escapeHtml(speaker.name)}</strong> - ${this.escapeHtml(speaker.ip)}
                        ${speaker.groupName ? ` (Group: ${this.escapeHtml(speaker.groupName)})` : ''}
                    </label>
                </div>
            `).join('');
            
            this.groupSpeakersContainer.innerHTML = speakerCheckboxes;
        }
        
        // Add event listener for the manual add button if it exists on the page
        document.getElementById('add-manual-speaker-btn')?.addEventListener('click', () => {
            this.addManualSpeakerByIP();
        });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    async addManualSpeakerByIP() {
        const name = document.getElementById('manual-speaker-name').value.trim();
        const ip = document.getElementById('manual-speaker-ip').value.trim();
        
        if (!ip) {
            this.showMessage('Please enter an IP address', 'error');
            return;
        }
        
        // Basic IP validation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            this.showMessage('Please enter a valid IP address', 'error');
            return;
        }
        
        const ipParts = ip.split('.');
        const isValidIP = ipParts.every(part => parseInt(part, 10) >= 0 && parseInt(part, 10) <= 255);
        
        if (!isValidIP) {
            this.showMessage('Please enter a valid IP address', 'error');
            return;
        }
        
        // Disable button during request
        const addBtn = document.getElementById('add-manual-speaker-btn');
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';
        
        try {
            const params = new URLSearchParams();
            params.append('ip', ip);
            if (name && name.trim()) {
                params.append('name', name);
            }
            
            const response = await fetch(`${this.apiBaseUrl}/addSpeaker?${params.toString()}`, {
                method: 'POST'
            });
            
            const responseText = await response.text(); // Get text response to parse JSON properly
            
            // Reload speakers to reflect changes
            setTimeout(() => {
                this.loadSpeakers();
            }, 1000);
            
            if (response.ok) {
                const result = JSON.parse(responseText);
                this.showMessage(`Speaker added successfully: ${result.speaker ? result.speaker.name : 'Unknown'} (${ip})`, 'success');
                
                // Clear the form
                document.getElementById('manual-speaker-name').value = '';
                document.getElementById('manual-speaker-ip').value = '';
            } else {
                // Handle both JSON and plain text error responses
                let errorMessage = 'Unknown error';
                try {
                    const errorResult = JSON.parse(responseText);
                    errorMessage = errorResult.message || 'Error adding speaker';
                } catch (e) {
                    // If it's not JSON, use the raw text
                    errorMessage = responseText || 'Error adding speaker';
                }
                this.showMessage(`Error adding speaker: ${errorMessage}`, 'error');
            }
        } catch (error) {
            this.showMessage(`Error adding speaker: ${error.message}`, 'error');
        } finally {
            // Re-enable button
            addBtn.disabled = false;
            addBtn.textContent = 'Add Speaker';
        }
    }
    
    async createGroup() {
        const groupName = this.groupNameInput.value.trim();
        const speakersToGroup = Array.from(this.selectedSpeakers);
        
        if (speakersToGroup.length === 0) {
            this.showMessage('Please select at least one speaker to group', 'error');
            return;
        }
        
        if (speakersToGroup.length < 2) {
            this.showMessage('You need at least 2 speakers to create a group', 'error');
            return;
        }
        
        this.createGroupBtn.disabled = true;
        this.createGroupBtn.textContent = 'Creating...';
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    speakerName: speakersToGroup
                })
            });
            
            const result = await response.text();
            this.showMessage(`Group creation response: ${result}`, response.status === 200 ? 'success' : 'error');
            
            // Reload speakers to reflect changes
            setTimeout(() => {
                this.loadSpeakers();
            }, 1000);
            
        } catch (error) {
            this.showMessage(`Error creating group: ${error.message}`, 'error');
        } finally {
            this.createGroupBtn.disabled = false;
            this.createGroupBtn.textContent = 'Create Group';
        }
    }
    
    async ungroup() {
        const selectedGroup = this.selectGroup.value;
        
        if (!selectedGroup) {
            this.showMessage('Please select a group to ungroup', 'error');
            return;
        }
        
        this.ungroupBtn.disabled = true;
        this.ungroupBtn.textContent = 'Ungrouping...';
        
        try {
            const url = selectedGroup === 'all' 
                ? `${this.apiBaseUrl}/ungroup` 
                : `${this.apiBaseUrl}/ungroup?group_name=${encodeURIComponent(selectedGroup)}`;
                
            const response = await fetch(url, {
                method: 'GET'
            });
            
            const result = await response.text();
            this.showMessage(`Ungroup response: ${result}`, response.status === 200 ? 'success' : 'error');
            
            // Reload speakers to reflect changes
            setTimeout(() => {
                this.loadSpeakers();
            }, 1000);
            
        } catch (error) {
            this.showMessage(`Error ungrouping: ${error.message}`, 'error');
        } finally {
            this.ungroupBtn.disabled = false;
            this.ungroupBtn.textContent = 'Ungroup';
        }
    }
    
    showMessage(message, type = 'info') {
        this.responseContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        // Auto-scroll to response
        this.responseContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    toggleSpeakerSelection(speakerName) {
        if (this.selectedSpeakers.has(speakerName)) {
            this.selectedSpeakers.delete(speakerName);
        } else {
            this.selectedSpeakers.add(speakerName);
        }
        
        // Update UI to reflect selection
        const checkboxes = document.querySelectorAll('.speaker-checkbox input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.value === speakerName) {
                checkbox.checked = this.selectedSpeakers.has(speakerName);
                
                // Update the parent element's selected class
                const parent = checkbox.closest('.speaker-checkbox');
                if (this.selectedSpeakers.has(speakerName)) {
                    parent.classList.add('selected');
                } else {
                    parent.classList.remove('selected');
                }
            }
        });
    }
}

// Global variable to allow access from inline event handlers
let speakerUI;

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    speakerUI = new SpeakerControllerUI();
});