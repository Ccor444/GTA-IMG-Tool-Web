/**
 * UI Manager for GTA IMG Tool
 */

class UIManager {
    constructor(app) {
        this.app = app;
        this.initElements();
        this.initEvents();
    }

    initElements() {
        // Window controls
        this.minimizeBtn = document.getElementById('minimizeBtn');
        this.maximizeBtn = document.getElementById('maximizeBtn');
        this.closeBtn = document.getElementById('closeBtn');
        this.windowTitle = document.getElementById('windowTitle');
        
        // Menu items
        this.menuItems = {
            newArchive: document.getElementById('newArchive'),
            openArchive: document.getElementById('openArchive'),
            saveArchive: document.getElementById('saveArchive'),
            closeArchive: document.getElementById('closeArchive'),
            exitApp: document.getElementById('exitApp'),
            selectAll: document.getElementById('selectAll'),
            deleteSelected: document.getElementById('deleteSelected'),
            importFiles: document.getElementById('importFiles'),
            importFolder: document.getElementById('importFolder'),
            exportSelected: document.getElementById('exportSelected'),
            exportAll: document.getElementById('exportAll'),
            packArchive: document.getElementById('packArchive'),
            refresh: document.getElementById('refresh'),
            about: document.getElementById('about')
        };
        
        // Toolbar buttons
        this.toolbar = {
            new: document.getElementById('toolbarNew'),
            open: document.getElementById('toolbarOpen'),
            save: document.getElementById('toolbarSave'),
            import: document.getElementById('toolbarImport'),
            export: document.getElementById('toolbarExport'),
            delete: document.getElementById('toolbarDelete')
        };
        
        // Search
        this.searchInput = document.getElementById('searchInput');
        
        // Main content
        this.emptyState = document.getElementById('emptyState');
        this.fileListContainer = document.getElementById('fileListContainer');
        this.fileTableBody = document.getElementById('fileTableBody');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingMessage = document.getElementById('loadingMessage');
        
        // Status bar
        this.statusMessage = document.getElementById('statusMessage');
        this.archiveInfo = document.getElementById('archiveInfo');
        this.selectionCount = document.getElementById('selectionCount');
        
        // Dialogs
        this.dialogs = {
            about: document.getElementById('aboutDialog'),
            confirm: document.getElementById('confirmDialog'),
            input: document.getElementById('inputDialog'),
            message: document.getElementById('messageDialog')
        };
        
        // Dialog elements
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmIcon = document.getElementById('confirmIcon');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmSubMessage = document.getElementById('confirmSubMessage');
        this.confirmCancel = document.getElementById('confirmCancel');
        this.confirmOk = document.getElementById('confirmOk');
        
        this.inputTitle = document.getElementById('inputTitle');
        this.inputPrompt = document.getElementById('inputPrompt');
        this.inputField = document.getElementById('inputField');
        this.inputCancel = document.getElementById('inputCancel');
        this.inputOk = document.getElementById('inputOk');
        
        this.messageTitle = document.getElementById('messageTitle');
        this.messageIcon = document.getElementById('messageIcon');
        this.messageText = document.getElementById('messageText');
        this.messageOk = document.getElementById('messageOk');
        
        // About dialog links
        this.linkWebsite = document.getElementById('linkWebsite');
        this.linkYouTube = document.getElementById('linkYouTube');
        this.linkGitHub = document.getElementById('linkGitHub');
        this.linkEmail = document.getElementById('linkEmail');
        this.linkSupport = document.getElementById('linkSupport');
        this.aboutClose = document.getElementById('aboutClose');
        
        // Empty state buttons
        this.emptyOpen = document.getElementById('emptyOpen');
        this.emptyNew = document.getElementById('emptyNew');
        
        // Dialog close buttons
        document.querySelectorAll('.dialog-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllDialogs());
        });
    }

    initEvents() {
        // Window controls
        this.minimizeBtn.addEventListener('click', () => this.minimizeWindow());
        this.maximizeBtn.addEventListener('click', () => this.maximizeWindow());
        this.closeBtn.addEventListener('click', () => this.closeWindow());
        
        // Menu items
        this.menuItems.newArchive.addEventListener('click', () => this.app.newArchive());
        this.menuItems.openArchive.addEventListener('click', () => this.app.openArchive());
        this.menuItems.saveArchive.addEventListener('click', () => this.app.saveArchive());
        this.menuItems.closeArchive.addEventListener('click', () => this.app.closeArchive());
        this.menuItems.exitApp.addEventListener('click', () => this.closeWindow());
        this.menuItems.selectAll.addEventListener('click', () => this.selectAll());
        this.menuItems.deleteSelected.addEventListener('click', () => this.app.deleteSelected());
        this.menuItems.importFiles.addEventListener('click', () => this.app.importFiles());
        this.menuItems.importFolder.addEventListener('click', () => this.app.importFolder());
        this.menuItems.exportSelected.addEventListener('click', () => this.app.exportSelected());
        this.menuItems.exportAll.addEventListener('click', () => this.app.exportAll());
        this.menuItems.packArchive.addEventListener('click', () => this.app.packArchive());
        this.menuItems.refresh.addEventListener('click', () => this.app.refresh());
        this.menuItems.about.addEventListener('click', () => this.showAbout());
        
        // Toolbar
        this.toolbar.new.addEventListener('click', () => this.app.newArchive());
        this.toolbar.open.addEventListener('click', () => this.app.openArchive());
        this.toolbar.save.addEventListener('click', () => this.app.saveArchive());
        this.toolbar.import.addEventListener('click', () => this.app.importFiles());
        this.toolbar.export.addEventListener('click', () => this.app.exportSelected());
        this.toolbar.delete.addEventListener('click', () => this.app.deleteSelected());
        
        // Search
        this.searchInput.addEventListener('input', () => this.app.filterEntries(this.searchInput.value));
        
        // Empty state
        this.emptyOpen.addEventListener('click', () => this.app.openArchive());
        this.emptyNew.addEventListener('click', () => this.app.newArchive());
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => this.dragOver(e));
        document.body.addEventListener('drop', (e) => this.drop(e));
        
        // About dialog links
        this.linkWebsite.addEventListener('click', () => window.open('https://vaibhavpandey.com/'));
        this.linkYouTube.addEventListener('click', () => window.open('https://www.youtube.com/channel/UC5uV1PRvtnNj9P8VfqO93Pw'));
        this.linkGitHub.addEventListener('click', () => window.open('https://github.com/vaibhavpandeyvpz/gtaimg'));
        this.linkEmail.addEventListener('click', () => window.location.href = 'mailto:contact@vaibhavpandey.com');
        this.linkSupport.addEventListener('click', () => window.open('https://github.com/vaibhavpandeyvpz/gtaimg/issues'));
        this.aboutClose.addEventListener('click', () => this.closeAllDialogs());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    this.app.newArchive();
                    break;
                case 'o':
                    e.preventDefault();
                    this.app.openArchive();
                    break;
                case 's':
                    e.preventDefault();
                    this.app.saveArchive();
                    break;
                case 'w':
                    e.preventDefault();
                    this.app.closeArchive();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
            }
        } else {
            switch (e.key) {
                case 'Delete':
                    this.app.deleteSelected();
                    break;
                case 'F5':
                    e.preventDefault();
                    this.app.refresh();
                    break;
            }
        }
    }

    dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    drop(e) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const imgFile = files.find(f => f.name.toLowerCase().endsWith('.img'));
            if (imgFile) {
                this.app.openArchiveFile(imgFile);
            }
        }
    }

    // Window controls
    minimizeWindow() {
        // In a web app, we can't actually minimize
        // This is just for visual feedback
    }

    maximizeWindow() {
        const icon = this.maximizeBtn.querySelector('i');
        if (icon.classList.contains('fa-window-maximize')) {
            icon.classList.remove('fa-window-maximize');
            icon.classList.add('fa-window-restore');
            document.body.style.overflow = 'hidden';
        } else {
            icon.classList.remove('fa-window-restore');
            icon.classList.add('fa-window-maximize');
            document.body.style.overflow = 'auto';
        }
    }

    closeWindow() {
        if (this.app.archive && this.app.archive.hasUnsavedChanges) {
            this.showConfirm(
                'Unsaved Changes',
                'You have unsaved changes. Do you want to save before closing?',
                null,
                'warning',
                () => {
                    this.app.saveArchive().then(() => window.close());
                },
                () => window.close(),
                'Save',
                'Don\'t Save'
            );
        } else {
            window.close();
        }
    }

    // UI state updates
    updateUI() {
        const hasArchive = this.app.archive !== null;
        const hasEntries = hasArchive && this.app.archive.entryCount > 0;
        const hasSelection = this.app.selectedEntries.length > 0;
        
        // Update visibility
        this.emptyState.style.display = hasArchive ? 'none' : 'flex';
        this.fileListContainer.style.display = hasArchive ? 'block' : 'none';
        
        // Update menu items
        const menuItems = [
            this.menuItems.saveArchive,
            this.menuItems.closeArchive,
            this.menuItems.selectAll,
            this.menuItems.deleteSelected,
            this.menuItems.importFiles,
            this.menuItems.importFolder,
            this.menuItems.exportSelected,
            this.menuItems.exportAll,
            this.menuItems.packArchive,
            this.menuItems.refresh
        ];
        
        menuItems.forEach(item => {
            if (hasArchive) {
                item.removeAttribute('disabled');
            } else {
                item.setAttribute('disabled', 'true');
            }
        });
        
        // Update toolbar
        this.toolbar.save.disabled = !hasArchive;
        this.toolbar.import.disabled = !hasArchive;
        this.toolbar.export.disabled = !hasSelection;
        this.toolbar.delete.disabled = !hasSelection;
        
        // Update search
        this.searchInput.disabled = !hasArchive;
        
        // Update status bar
        if (hasArchive) {
            this.archiveInfo.textContent = this.app.archive.getArchiveInfo();
        } else {
            this.archiveInfo.textContent = '';
        }
        
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        if (this.app.selectedEntries.length > 0) {
            this.selectionCount.textContent = `${this.app.selectedEntries.length} selected`;
        } else {
            this.selectionCount.textContent = '';
        }
    }

    updateFileList(entries) {
        this.fileTableBody.innerHTML = '';
        
        entries.forEach(entry => {
            const row = document.createElement('tr');
            row.dataset.name = entry.name;
            
            if (this.app.selectedEntries.includes(entry)) {
                row.classList.add('selected');
            }
            
            row.innerHTML = `
                <td>${entry.name}</td>
                <td>${this.app.archive.getFileTypeInfo(entry.name)}</td>
                <td>${this.app.archive.formatSize(entry.sizeInBytes)}</td>
                <td>${entry.offset}</td>
            `;
            
            row.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    this.toggleRowSelection(row, entry);
                } else if (e.shiftKey) {
                    // Range selection - simplified
                    this.selectRange(entry);
                } else {
                    this.selectSingle(row, entry);
                }
            });
            
            row.addEventListener('dblclick', () => {
                this.app.exportEntry(entry);
            });
            
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, entry);
            });
            
            this.fileTableBody.appendChild(row);
        });
    }

    toggleRowSelection(row, entry) {
        if (row.classList.contains('selected')) {
            row.classList.remove('selected');
            this.app.selectedEntries = this.app.selectedEntries.filter(e => e !== entry);
        } else {
            row.classList.add('selected');
            this.app.selectedEntries.push(entry);
        }
        this.updateUI();
    }

    selectSingle(row, entry) {
        document.querySelectorAll('#fileTableBody tr.selected').forEach(r => {
            r.classList.remove('selected');
        });
        row.classList.add('selected');
        this.app.selectedEntries = [entry];
        this.updateUI();
    }

    selectRange(entry) {
        // Simplified range selection
        this.selectAll();
    }

    selectAll() {
        document.querySelectorAll('#fileTableBody tr').forEach(row => {
            row.classList.add('selected');
        });
        this.app.selectedEntries = [...this.app.archive.entries];
        this.updateUI();
    }

    showContextMenu(e, entry) {
        // In a real app, we'd show a custom context menu
        // For simplicity, we'll use the browser's default
    }

    // Loading overlay
    showLoading(message = 'Loading...') {
        this.loadingMessage.textContent = message;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    // Status message
    setStatus(message) {
        this.statusMessage.textContent = message;
    }

    // Window title
    setTitle(title) {
        this.windowTitle.textContent = title;
    }

    // Dialogs
    showAbout() {
        this.dialogs.about.style.display = 'flex';
    }

    showMessage(title, message, icon = 'info', callback = null) {
        this.messageTitle.textContent = title;
        this.messageText.textContent = message;
        
        const iconEl = this.messageIcon.querySelector('i');
        iconEl.className = '';
        
        switch (icon) {
            case 'warning':
                iconEl.className = 'fas fa-exclamation-triangle';
                iconEl.style.color = '#ecb731';
                break;
            case 'error':
                iconEl.className = 'fas fa-times-circle';
                iconEl.style.color = '#ed1b2e';
                break;
            case 'question':
                iconEl.className = 'fas fa-question-circle';
                iconEl.style.color = '#ff6a00';
                break;
            case 'info':
            default:
                iconEl.className = 'fas fa-info-circle';
                iconEl.style.color = '#0091cd';
                break;
        }
        
        this.dialogs.message.style.display = 'flex';
        
        const okHandler = () => {
            this.dialogs.message.style.display = 'none';
            this.messageOk.removeEventListener('click', okHandler);
            if (callback) callback();
        };
        
        this.messageOk.addEventListener('click', okHandler, { once: true });
    }

    showConfirm(title, message, subMessage = null, icon = 'question', onConfirm, onCancel = null, confirmText = 'Yes', cancelText = 'Cancel') {
        this.confirmTitle.textContent = title;
        this.confirmMessage.textContent = message;
        
        if (subMessage) {
            this.confirmSubMessage.textContent = subMessage;
            this.confirmSubMessage.style.display = 'block';
        } else {
            this.confirmSubMessage.style.display = 'none';
        }
        
        const iconEl = this.confirmIcon.querySelector('i');
        iconEl.className = '';
        
        switch (icon) {
            case 'warning':
                iconEl.className = 'fas fa-exclamation-triangle';
                iconEl.style.color = '#ecb731';
                break;
            case 'error':
                iconEl.className = 'fas fa-times-circle';
                iconEl.style.color = '#ed1b2e';
                break;
            case 'info':
                iconEl.className = 'fas fa-info-circle';
                iconEl.style.color = '#0091cd';
                break;
            case 'question':
            default:
                iconEl.className = 'fas fa-question-circle';
                iconEl.style.color = '#ff6a00';
                break;
        }
        
        this.confirmOk.textContent = confirmText;
        this.confirmCancel.textContent = cancelText;
        
        this.dialogs.confirm.style.display = 'flex';
        
        const confirmHandler = () => {
            this.dialogs.confirm.style.display = 'none';
            this.confirmOk.removeEventListener('click', confirmHandler);
            this.confirmCancel.removeEventListener('click', cancelHandler);
            if (onConfirm) onConfirm();
        };
        
        const cancelHandler = () => {
            this.dialogs.confirm.style.display = 'none';
            this.confirmOk.removeEventListener('click', confirmHandler);
            this.confirmCancel.removeEventListener('click', cancelHandler);
            if (onCancel) onCancel();
        };
        
        this.confirmOk.addEventListener('click', confirmHandler, { once: true });
        this.confirmCancel.addEventListener('click', cancelHandler, { once: true });
    }

    showInput(title, prompt, defaultValue = '', onConfirm, onCancel = null) {
        this.inputTitle.textContent = title;
        this.inputPrompt.textContent = prompt;
        this.inputField.value = defaultValue;
        
        this.dialogs.input.style.display = 'flex';
        this.inputField.focus();
        this.inputField.select();
        
        const confirmHandler = () => {
            this.dialogs.input.style.display = 'none';
            this.inputOk.removeEventListener('click', confirmHandler);
            this.inputCancel.removeEventListener('click', cancelHandler);
            this.inputField.removeEventListener('keydown', keyHandler);
            if (onConfirm) onConfirm(this.inputField.value);
        };
        
        const cancelHandler = () => {
            this.dialogs.input.style.display = 'none';
            this.inputOk.removeEventListener('click', confirmHandler);
            this.inputCancel.removeEventListener('click', cancelHandler);
            this.inputField.removeEventListener('keydown', keyHandler);
            if (onCancel) onCancel();
        };
        
        const keyHandler = (e) => {
            if (e.key === 'Enter') {
                confirmHandler();
            } else if (e.key === 'Escape') {
                cancelHandler();
            }
        };
        
        this.inputOk.addEventListener('click', confirmHandler, { once: true });
        this.inputCancel.addEventListener('click', cancelHandler, { once: true });
        this.inputField.addEventListener('keydown', keyHandler);
    }

    closeAllDialogs() {
        Object.values(this.dialogs).forEach(dialog => {
            dialog.style.display = 'none';
        });
    }
}