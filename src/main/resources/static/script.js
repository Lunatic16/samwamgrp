// Samsung Speaker Controller Web UI
class SpeakerControllerUI {
    constructor() {
        this.apiBaseUrl = `http://localhost:8888`;
        this.speakers = [];
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
            // Try to make a simple request to check if the server is running
            const response = await fetch(this.apiBaseUrl + '/status', { method: 'GET' });
            if (response.ok || response.status === 404) { // 404 is fine, means server is running
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
            // Since the backend doesn't have a direct endpoint to list speakers,
            // we'll display a message indicating that speakers are discovered via mDNS
            this.showSpeakersPlaceholder();
        } catch (error) {
            this.showError('Error loading speakers', this.speakersContainer);
            this.showError('Error loading speakers', this.groupSpeakersContainer);
        }
    }
    
    showLoading(container) {
        container.innerHTML = '<p class="loading">Loading speakers...</p>';
    }
    
    showError(message, container) {
        container.innerHTML = `<p class="error">${message}</p>`;
    }
    
    showSpeakersPlaceholder() {
        // Since the actual speakers are discovered via mDNS in the backend,
        // we'll create a UI to allow users to input speaker info
        const html = `
            <div class="speaker-card">
                <h3>Speaker Discovery</h3>
                <p class="speaker-details">Speakers are discovered automatically via mDNS.</p>
                <p class="speaker-details">This web interface is primarily a control interface.</p>
            </div>
            <div class="speaker-card">
                <h3>Add Speaker Manually</h3>
                <div class="form-group">
                    <label for="manual-speaker-name">Speaker Name:</label>
                    <input type="text" id="manual-speaker-name" placeholder="Enter speaker name">
                </div>
                <div class="form-group">
                    <label for="manual-speaker-ip">IP Address:</label>
                    <input type="text" id="manual-speaker-ip" placeholder="Enter IP (e.g., 192.168.1.100)">
                </div>
                <button id="add-speaker-btn" class="btn btn-primary">Add Speaker</button>
            </div>
        `;
        
        this.speakersContainer.innerHTML = html;
        this.groupSpeakersContainer.innerHTML = `
            <div class="speaker-card">
                <h3>Note</h3>
                <p class="speaker-details">Speakers discovered by the backend will appear here for grouping.</p>
                <p class="speaker-details">Currently, the backend discovers speakers via mDNS and makes them available.</p>
            </div>
        `;
        
        // Add event for manual speaker
        document.getElementById('add-speaker-btn')?.addEventListener('click', () => {
            this.addManualSpeaker();
        });
    }
    
    addManualSpeaker() {
        const name = document.getElementById('manual-speaker-name').value;
        const ip = document.getElementById('manual-speaker-ip').value;
        
        if (!name || !ip) {
            this.showMessage('Please enter both name and IP address', 'error');
            return;
        }
        
        // Add to a temporary list for UI demonstration
        const speaker = { name, ip, port: '55001' };
        this.showMessage(`Added speaker: ${name} (${ip})`, 'success');
        
        // Reset the form
        document.getElementById('manual-speaker-name').value = '';
        document.getElementById('manual-speaker-ip').value = '';
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

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpeakerControllerUI();
});