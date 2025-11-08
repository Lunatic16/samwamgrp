// Samsung Speaker Controller Web UI - Updated to match WAM-Nodejs style
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
        // Update element selections to match the new HTML structure
        this.refreshBtn = document.getElementById('refresh-btn');
        this.speakersContainer = document.getElementById('speakers-container');
        this.groupSpeakersContainer = document.getElementById('group-speakers-container');
        this.groupNameInput = document.getElementById('groupName');
        this.createGroupBtn = document.getElementById('create-group-btn');
        this.selectGroup = document.getElementById('selectGroup');
        this.ungroupBtn = document.getElementById('ungroup-btn');
        this.responseContainer = document.getElementById('response-container');
        this.statusIndicator = document.querySelector('#statusText .status-indicator') || document.querySelector('.status-indicator');
        this.speakerCount = document.getElementById('speakerCount');
        this.lastDiscovery = document.getElementById('lastDiscovery');
        this.statusMessage = document.getElementById('statusMessage');
        
        // For manual speaker addition
        this.addManualSpeakerBtn = document.getElementById('addManualSpeakerBtn');
        this.manualSpeakerName = document.getElementById('manualSpeakerName');
        this.manualSpeakerIp = document.getElementById('manualSpeakerIp');
    }

    bindEvents() {
        this.refreshBtn?.addEventListener('click', () => this.loadSpeakers());
        this.createGroupBtn?.addEventListener('click', () => this.createGroup());
        this.ungroupBtn?.addEventListener('click', () => this.ungroup());
        
        // Add manual speaker button event
        this.addManualSpeakerBtn?.addEventListener('click', () => this.addManualSpeakerByIP());
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/speakers`);
            if (response.ok) {
                this.updateSystemStatus(true, 'Connected');
            } else {
                this.updateSystemStatus(false, 'Connection Error');
            }
        } catch (error) {
            this.updateSystemStatus(false, 'Server Unreachable');
        }
    }

    updateSystemStatus(connected, message) {
        // Update the status indicator in the system status panel
        if (this.statusIndicator) {
            this.statusIndicator.className = connected ? 'status-indicator connected' : 'status-indicator disconnected';
            if (connected) {
                this.statusIndicator.style.backgroundColor = '#28a745';
            } else {
                this.statusIndicator.style.backgroundColor = '#dc3545';
            }
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

            // Update the system status info
            if (this.speakerCount) {
                this.speakerCount.textContent = Object.keys(this.speakers).length;
            }

            if (this.lastDiscovery) {
                this.lastDiscovery.textContent = new Date().toLocaleTimeString();
            }

        } catch (error) {
            console.error('Error loading speakers:', error);
            this.showError('Error loading speakers: ' + error.message, this.speakersContainer);
            this.showError('Error loading speakers: ' + error.message, this.groupSpeakersContainer);
        }
    }

    showLoading(container) {
        if (container) {
            container.innerHTML = '<p class="loading">Loading speakers...</p>';
        }
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<p class="error">${message}</p>`;
        }
    }

    displaySpeakers() {
        // Display speakers in the main speakers section as a table
        let speakerRows = '';
        if (Object.keys(this.speakers).length === 0) {
            speakerRows = '<tr><td colspan="5" class="text-center"><span class="loading">No speakers discovered yet. Speakers will appear here when discovered via mDNS.</span></td></tr>';
        } else {
            speakerRows = Object.values(this.speakers).map(speaker => `
                <tr>
                    <td>${this.escapeHtml(speaker.name)}</td>
                    <td>${this.escapeHtml(speaker.ip)}</td>
                    <td>${this.escapeHtml(speaker.port)}</td>
                    <td>${this.escapeHtml(speaker.mac)}</td>
                    <td>${this.escapeHtml(speaker.model || 'Samsung Speaker')}</td>
                </tr>
            `).join('');
        }

        if (this.speakersContainer) {
            this.speakersContainer.innerHTML = speakerRows;
        }

        // Fill the speaker selection with checkboxes
        if (Object.keys(this.speakers).length === 0) {
            if (this.groupSpeakersContainer) {
                this.groupSpeakersContainer.innerHTML = '<p class="loading">No speakers discovered yet. Speakers will appear here for grouping.</p>';
            }
        } else {
            const speakerCheckboxes = Object.values(this.speakers).map(speaker => `
                <div class="speaker-checkbox" data-speaker-name="${this.escapeHtml(speaker.name)}">
                    <input type="checkbox" id="chk_${this.escapeHtml(speaker.name)}" value="${this.escapeHtml(speaker.name)}" 
                        onchange="speakerUI.toggleSpeakerSelection('${this.escapeHtml(speaker.name)}')">
                    <label for="chk_${this.escapeHtml(speaker.name)}">
                        <strong>${this.escapeHtml(speaker.name)}</strong> - ${this.escapeHtml(speaker.ip)}
                        ${speaker.groupName ? ` (Group: ${this.escapeHtml(speaker.groupName)})` : ''}
                    </label>
                </div>
            `).join('');

            if (this.groupSpeakersContainer) {
                this.groupSpeakersContainer.innerHTML = speakerCheckboxes;
            }
        }

        // Update speaker count in the status panel
        if (this.speakerCount) {
            this.speakerCount.textContent = Object.keys(this.speakers).length;
        }
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
        const name = this.manualSpeakerName?.value.trim() || '';
        const ip = this.manualSpeakerIp?.value.trim();

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
        if (this.addManualSpeakerBtn) {
            this.addManualSpeakerBtn.disabled = true;
            this.addManualSpeakerBtn.textContent = 'Adding...';
        }

        try {
            const params = new URLSearchParams();
            params.append('ip', ip);
            if (name && name.trim()) {
                params.append('name', name);
            }

            const response = await fetch(`${this.apiBaseUrl}/addSpeaker?${params.toString()}`, {
                method: 'POST'
            });

            const responseText = await response.text();

            // Reload speakers to reflect changes
            setTimeout(() => {
                this.loadSpeakers();
            }, 1000);

            if (response.ok) {
                const result = JSON.parse(responseText);
                this.showMessage(`Speaker added successfully: ${result.speaker ? result.speaker.name : 'Unknown'} (${ip})`, 'success');

                // Clear the form
                if (this.manualSpeakerName) this.manualSpeakerName.value = '';
                if (this.manualSpeakerIp) this.manualSpeakerIp.value = '';
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
            if (this.addManualSpeakerBtn) {
                this.addManualSpeakerBtn.disabled = false;
                this.addManualSpeakerBtn.textContent = 'Add Speaker';
            }
        }
    }

    async createGroup() {
        const groupName = this.groupNameInput?.value.trim();
        
        // Get selected speakers from the checkboxes
        const selectedSpeakerElements = document.querySelectorAll('.speaker-checkbox input[type="checkbox"]:checked');
        if (!selectedSpeakerElements) {
            this.showMessage('Speaker checkbox selection not found', 'error');
            return;
        }
        
        const selectedSpeakers = Array.from(selectedSpeakerElements).map(checkbox => checkbox.value);
        
        if (selectedSpeakers.length === 0) {
            this.showMessage('Please select at least one speaker to group', 'error');
            return;
        }

        if (selectedSpeakers.length < 2) {
            this.showMessage('You need at least 2 speakers to create a group', 'error');
            return;
        }

        if (this.createGroupBtn) {
            this.createGroupBtn.disabled = true;
            this.createGroupBtn.textContent = 'Creating...';
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    speakerName: selectedSpeakers
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
            if (this.createGroupBtn) {
                this.createGroupBtn.disabled = false;
                this.createGroupBtn.textContent = 'Create Group';
            }
        }
    }

    async ungroup() {
        const selectedGroup = this.selectGroup?.value;

        if (!selectedGroup) {
            this.showMessage('Please select a group to ungroup', 'error');
            return;
        }

        if (this.ungroupBtn) {
            this.ungroupBtn.disabled = true;
            this.ungroupBtn.textContent = 'Ungrouping...';
        }

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
            if (this.ungroupBtn) {
                this.ungroupBtn.disabled = false;
                this.ungroupBtn.textContent = 'Ungroup';
            }
        }
    }

    showMessage(message, type = 'info') {
        // Map our message types to Bootstrap alert classes
        let alertClass = 'alert alert-info';
        if (type === 'success') {
            alertClass = 'alert alert-success';
        } else if (type === 'error') {
            alertClass = 'alert alert-danger';
        } else if (type === 'warning') {
            alertClass = 'alert alert-warning';
        }
        
        if (this.responseContainer) {
            this.responseContainer.innerHTML = `<div class="${alertClass}" role="alert">${message}</div>`;
        }
        
        // Update status message
        if (this.statusMessage) {
            this.statusMessage.textContent = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        }
    }

    toggleSpeakerSelection(speakerName) {
        if (this.selectedSpeakers.has(speakerName)) {
            this.selectedSpeakers.delete(speakerName);
        } else {
            this.selectedSpeakers.add(speakerName);
        }

        // Update UI to reflect selection
        const checkboxes = document.querySelectorAll('input.speaker-checkbox');
        checkboxes.forEach(checkbox => {
            if (checkbox.value === speakerName) {
                checkbox.checked = this.selectedSpeakers.has(speakerName);

                // Update the parent card's appearance
                const card = checkbox.closest('.card');
                if (card) {
                    if (this.selectedSpeakers.has(speakerName)) {
                        card.classList.add('border-primary', 'shadow-sm');
                    } else {
                        card.classList.remove('border-primary', 'shadow-sm');
                    }
                }
            }
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.speakerUI = new SpeakerControllerUI();
});