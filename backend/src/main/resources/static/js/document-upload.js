// Document Upload Cockpit Controller

let cockpitUploads = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!SlashDR.isAuthenticated()) return;

    DocumentCockpit.init();
});

const DocumentCockpit = {
    init() {
        // Load history from localStorage
        this.loadHistory();

        // Bind Drag & Drop Events
        const dropzone = document.getElementById('large-dropzone');
        const fileInput = document.getElementById('cockpit-file-input');

        dropzone.addEventListener('click', () => fileInput.click());

        // Highlight drop zone on drag over
        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--primary)';
                dropzone.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(99, 102, 241, 0.05) 100%)';
            });
        });

        ['dragleave', 'dragend', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--border-color)';
                dropzone.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.005) 0%, rgba(255, 255, 255, 0.015) 100%)';
            });
        });

        // Drop file
        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.uploadFile(files[0]);
            }
        });

        // Select file
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                this.uploadFile(fileInput.files[0]);
            }
        });

        // Clear History
        document.getElementById('btn-clear-all-history').addEventListener('click', () => {
            if (confirm('Clear upload history from the cockpit list? This will not delete the files from the server.')) {
                this.clearAllHistory();
            }
        });

        // Reveal Page content
        document.getElementById('page-content').style.display = 'block';
    },

    loadHistory() {
        const data = localStorage.getItem('slashdr_cockpit_uploads');
        if (data) {
            try {
                cockpitUploads = JSON.parse(data);
            } catch (e) {
                cockpitUploads = [];
            }
        }
        this.renderHistoryList();
    },

    saveHistory() {
        localStorage.setItem('slashdr_cockpit_uploads', JSON.stringify(cockpitUploads));
        this.renderHistoryList();
    },

    clearAllHistory() {
        cockpitUploads = [];
        this.saveHistory();
    },

    deleteHistoryItem(index) {
        cockpitUploads.splice(index, 1);
        this.saveHistory();
    },

    renderHistoryList() {
        const container = document.getElementById('doc-list-container');
        const emptyState = document.getElementById('cockpit-empty-state');
        const btnClear = document.getElementById('btn-clear-all-history');

        if (cockpitUploads.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            btnClear.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        btnClear.style.display = 'inline-flex';

        // Display newest first
        container.innerHTML = cockpitUploads.map((doc, idx) => {
            const isImage = doc.type.startsWith('image/');
            const dateLabel = new Date(doc.uploadedAt).toLocaleString();
            const badgeClass = isImage ? 'badge-valid' : 'badge-urgent';
            const extensionLabel = doc.name.split('.').pop().toUpperCase();

            return `
                <div class="doc-item-card" style="animation-delay: ${idx * 0.05}s;">
                    <div class="doc-meta">
                        <div class="doc-icon-wrapper ${isImage ? 'image-type' : ''}">
                            ${isImage 
                                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
                                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
                            }
                        </div>
                        <div class="doc-title-block">
                            <span class="doc-name" title="${doc.name}">${doc.name}</span>
                            <div class="doc-details">
                                <span class="badge ${badgeClass}" style="padding: 0.1rem 0.4rem; font-size: 0.65rem;">${extensionLabel}</span>
                                <span>&bull;</span>
                                <span>${doc.size}</span>
                                <span>&bull;</span>
                                <span>${dateLabel}</span>
                            </div>
                        </div>
                    </div>
                    <div class="doc-actions-row">
                        <button class="doc-mini-btn" onclick="DocumentCockpit.copyLink('${doc.url}', this)" title="Copy Link URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button class="doc-mini-btn" onclick="DocumentCockpit.viewFile('${doc.url}')" title="Preview / View file">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="doc-mini-btn btn-delete-item" onclick="DocumentCockpit.deleteHistoryItem(${idx})" title="Remove from list">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    async uploadFile(file) {
        // 1. Extension validations
        const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            alert('File type not supported. Please upload PDF, PNG, or JPG/JPEG certificates.');
            return;
        }

        // 2. Size validations
        if (file.size > 5 * 1024 * 1024) {
            alert('File exceeds 5MB size limit.');
            return;
        }

        // UI progress reveal
        const progressCard = document.getElementById('upload-progress-card');
        const fill = document.getElementById('upload-bar-fill');
        const percentageText = document.getElementById('uploading-percentage');
        const filenameText = document.getElementById('uploading-file-name');

        filenameText.textContent = file.name;
        fill.style.width = '0%';
        percentageText.textContent = '0%';
        progressCard.style.display = 'flex';

        // Simulate progress bar micro-interaction for premium feel
        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 90) {
                progress += Math.floor(Math.random() * 15) + 5;
                if (progress > 90) progress = 90;
                fill.style.width = `${progress}%`;
                percentageText.textContent = `${progress}%`;
            }
        }, 100);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const data = await SlashDR.apiFetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            });

            // Finish progress bar
            clearInterval(interval);
            fill.style.width = '100%';
            percentageText.textContent = '100%';

            setTimeout(() => {
                progressCard.style.display = 'none';
                
                // Add to history array
                cockpitUploads.unshift({
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    type: file.type || 'application/octet-stream',
                    uploadedAt: Date.now(),
                    url: data.url,
                    documentId: data.documentId
                });

                this.saveHistory();
                this.showToast('Document uploaded and encrypted successfully!');
            }, 300);

        } catch (error) {
            clearInterval(interval);
            progressCard.style.display = 'none';
            alert('Upload failed: ' + error.message);
        }
    },

    async viewFile(url) {
        try {
            const blob = await SlashDR.apiFetch(url);
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank');
        } catch (error) {
            alert('Access denied or file not found: ' + error.message);
        }
    },

    copyLink(url, btnElement) {
        const fullPath = window.location.origin + url;
        navigator.clipboard.writeText(fullPath).then(() => {
            // Visual micro-feedback: switch to checkmark icon
            const originalIconHtml = btnElement.innerHTML;
            btnElement.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-valid-text)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
            btnElement.style.borderColor = 'var(--status-valid-border)';
            btnElement.style.backgroundColor = 'var(--status-valid-bg)';

            this.showToast('Link copied to clipboard!');

            setTimeout(() => {
                btnElement.innerHTML = originalIconHtml;
                btnElement.style.borderColor = '';
                btnElement.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            alert('Failed to copy text: ' + err.message);
        });
    },

    showToast(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const toast = document.createElement('div');
            toast.className = 'alert alert-success animate-fade-in';
            toast.style.position = 'fixed';
            toast.style.top = '2rem';
            toast.style.right = '2rem';
            toast.style.zIndex = '9999';
            toast.style.boxShadow = 'var(--shadow-xl)';
            toast.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 350);
            }, 3000);
        }
    }
};
