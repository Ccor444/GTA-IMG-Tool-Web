/**
 * GTA IMG Tool Web - Main Application
 * Copyright (c) 2025 Vaibhav Pandey <contact@vaibhavpandey.com>
 */

class GtaImgToolApp {
    constructor() {
        this.archive = null;
        this.selectedEntries = [];
        this.filteredEntries = [];
        this.ui = new UIManager(this);
        
        this.init();
    }

    init() {
        this.ui.setStatus('Ready');
        this.ui.updateUI();
    }

    // Archive operations
    async newArchive() {
        if (this.archive && this.archive.hasUnsavedChanges) {
            this.ui.showConfirm(
                'Unsaved Changes',
                'You have unsaved changes. Create new archive anyway?',
                null,
                'warning',
                () => this._doNewArchive(),
                null,
                'Continue',
                'Cancel'
            );
        } else {
            this._doNewArchive();
        }
    }

    async _doNewArchive() {
        this.ui.showConfirm(
            'Select Archive Version',
            'Create a VER2 archive (GTA San Andreas)?',
            'VER2 = single .img file (GTA SA)\nVER1 = .img + .dir files (GTA III/VC)',
            'question',
            async () => {
                // VER2 selected
                const fileName = `new_archive_${Date.now()}.img`;
                this.archive = await IMGArchive.createArchive(fileName, IMGVersion.VER2);
                this._afterArchiveOpen();
                this.ui.setStatus(`Created new VER2 archive`);
            },
            async () => {
                // VER1 selected
                const fileName = `new_archive_${Date.now()}.img`;
                this.archive = await IMGArchive.createArchive(fileName, IMGVersion.VER1);
                this._afterArchiveOpen();
                this.ui.setStatus(`Created new VER1 archive`);
            },
            'VER2',
            'VER1'
        );
    }

    openArchive() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.img,.dir';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length === 0) return;
            
            const imgFile = files.find(f => f.name.toLowerCase().endsWith('.img'));
            const dirFile = files.find(f => f.name.toLowerCase().endsWith('.dir'));
            
            if (imgFile && dirFile) {
                this.openArchiveWithDir(imgFile, dirFile);
            } else if (imgFile) {
                this.openArchiveFile(imgFile);
            } else {
                this.ui.showMessage('Error', 'Please select an IMG file.', 'error');
            }
        };
        
        input.click();
    }

    async openArchiveFile(file) {
        if (this.archive && this.archive.hasUnsavedChanges) {
            this.ui.showConfirm(
                'Unsaved Changes',
                'You have unsaved changes. Open another archive anyway?',
                null,
                'warning',
                () => this._doOpenArchiveFile(file),
                null,
                'Continue',
                'Cancel'
            );
        } else {
            this._doOpenArchiveFile(file);
        }
    }

    async _doOpenArchiveFile(file) {
        try {
            this.ui.showLoading('Opening archive...');
            
            this.archive = await IMGArchive.openArchive(file);
            
            this._afterArchiveOpen();
            this.ui.setStatus(`Opened archive with ${this.archive.entryCount} files`);
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to open archive: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async openArchiveWithDir(imgFile, dirFile) {
        try {
            this.ui.showLoading('Opening archive...');
            
            this.archive = await IMGArchive.openArchiveWithDir(imgFile, dirFile);
            
            this._afterArchiveOpen();
            this.ui.setStatus(`Opened archive with ${this.archive.entryCount} files`);
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to open archive: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async saveArchive() {
        if (!this.archive) return;
        
        try {
            this.ui.showLoading('Saving archive...');
            
            await this.archive.save();
            
            this.ui.setStatus('Archive saved successfully');
            this.ui.updateUI();
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to save archive: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    closeArchive() {
        if (this.archive && this.archive.hasUnsavedChanges) {
            this.ui.showConfirm(
                'Unsaved Changes',
                'You have unsaved changes. Close anyway?',
                null,
                'warning',
                () => this._doCloseArchive(),
                null,
                'Close',
                'Cancel'
            );
        } else {
            this._doCloseArchive();
        }
    }

    _doCloseArchive() {
        this.archive = null;
        this.selectedEntries = [];
        this.filteredEntries = [];
        
        this.ui.updateFileList([]);
        this.ui.setStatus('Ready');
        this.ui.updateUI();
        this.ui.setTitle('GTA IMG Tool by VPZ');
    }

    _afterArchiveOpen() {
        this.selectedEntries = [];
        this.filteredEntries = [...this.archive.entries];
        
        this.ui.updateFileList(this.filteredEntries);
        this.ui.updateUI();
        this.ui.setTitle(`${this.archive.fileName} - GTA IMG Tool by VPZ`);
    }

    // Import operations
    importFiles() {
        if (!this.archive) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this._doImportFiles(files);
        };
        
        input.click();
    }

    async _doImportFiles(files) {
        if (!this.archive) return;
        
        this.ui.showLoading('Importing files...');
        
        let imported = 0;
        let skipped = 0;
        const errors = [];
        
        for (const file of files) {
            try {
                const fileName = file.name;
                
                // Check name length
                if (fileName.length > IMGEntry.MAX_NAME_LENGTH) {
                    errors.push(`${fileName}: Name too long (max ${IMGEntry.MAX_NAME_LENGTH} chars)`);
                    skipped++;
                    continue;
                }
                
                // Check if exists
                if (this.archive.containsEntry(fileName)) {
                    const shouldReplace = await new Promise(resolve => {
                        this.ui.showConfirm(
                            'File Exists',
                            `'${fileName}' already exists. Replace it?`,
                            null,
                            'question',
                            () => resolve(true),
                            () => resolve(false),
                            'Replace',
                            'Skip'
                        );
                    });
                    
                    if (!shouldReplace) {
                        skipped++;
                        continue;
                    }
                    
                    this.archive.removeEntry(fileName);
                }
                
                this.ui.setStatus(`Importing ${fileName}...`);
                
                const data = await this._readFileAsArrayBuffer(file);
                
                this.archive.addEntry(fileName, new Uint8Array(data));
                imported++;
            } catch (error) {
                errors.push(`${file.name}: ${error.message}`);
                skipped++;
            }
        }
        
        this.filteredEntries = [...this.archive.entries];
        this.ui.updateFileList(this.filteredEntries);
        this.ui.updateUI();
        
        let message = `Imported ${imported} file(s)`;
        if (skipped > 0) message += `, ${skipped} skipped`;
        
        this.ui.setStatus(message);
        
        if (errors.length > 0) {
            const errorText = errors.slice(0, 10).join('\n') + 
                (errors.length > 10 ? `\n...and ${errors.length - 10} more` : '');
            this.ui.showMessage('Import Complete', `${message}\n\nErrors:\n${errorText}`, 'warning');
        }
        
        this.ui.hideLoading();
    }

    importFolder() {
        // In a web app, we can't select folders directly
        // This is a workaround using multiple file selection
        this.importFiles();
    }

    // Export operations
    exportSelected() {
        if (!this.archive || this.selectedEntries.length === 0) return;
        
        this._exportEntries(this.selectedEntries);
    }

    exportAll() {
        if (!this.archive || this.archive.entryCount === 0) return;
        
        this._exportEntries(this.archive.entries);
    }

    async exportEntry(entry) {
        try {
            this.ui.showLoading(`Exporting ${entry.name}...`);
            
            await this.archive.exportEntry(entry.name);
            
            this.ui.setStatus(`Exported ${entry.name}`);
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to export ${entry.name}: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async _exportEntries(entries) {
        if (entries.length === 1) {
            await this.exportEntry(entries[0]);
            return;
        }
        
        this.ui.showLoading(`Exporting ${entries.length} files...`);
        
        let exported = 0;
        const errors = [];
        
        for (const entry of entries) {
            try {
                this.ui.setStatus(`Exporting ${entry.name}...`);
                await this.archive.exportEntry(entry.name);
                exported++;
            } catch (error) {
                errors.push(`${entry.name}: ${error.message}`);
            }
        }
        
        this.ui.setStatus(`Exported ${exported} file(s)`);
        
        if (errors.length > 0) {
            const errorText = errors.slice(0, 10).join('\n') + 
                (errors.length > 10 ? `\n...and ${errors.length - 10} more` : '');
            this.ui.showMessage('Export Complete', `Exported ${exported} file(s)\n\nErrors:\n${errorText}`, 'warning');
        } else {
            this.ui.showMessage('Export Complete', `Successfully exported ${exported} file(s)`, 'info');
        }
        
        this.ui.hideLoading();
    }

    // Delete operations
    deleteSelected() {
        if (!this.archive || this.selectedEntries.length === 0) return;
        
        const count = this.selectedEntries.length;
        
        this.ui.showConfirm(
            'Confirm Delete',
            `Are you sure you want to delete ${count} selected file(s)?`,
            'This action cannot be undone.',
            'warning',
            () => this._doDeleteSelected(),
            null,
            'Delete',
            'Cancel'
        );
    }

    async _doDeleteSelected() {
        if (!this.archive) return;
        
        this.ui.showLoading('Deleting files...');
        
        const toDelete = [...this.selectedEntries];
        let deleted = 0;
        
        for (const entry of toDelete) {
            try {
                this.ui.setStatus(`Deleting ${entry.name}...`);
                this.archive.removeEntry(entry.name);
                deleted++;
            } catch (error) {
                console.error(error);
            }
        }
        
        this.selectedEntries = [];
        this.filteredEntries = [...this.archive.entries];
        this.ui.updateFileList(this.filteredEntries);
        this.ui.updateUI();
        this.ui.setStatus(`Deleted ${deleted} file(s)`);
        
        this.ui.hideLoading();
    }

    // Replace operation
    replaceEntry(entry) {
        if (!this.archive || !entry) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this._doReplaceEntry(entry, file);
            }
        };
        
        input.click();
    }

    async _doReplaceEntry(entry, file) {
        this.ui.showLoading(`Replacing ${entry.name}...`);
        
        try {
            const data = await this._readFileAsArrayBuffer(file);
            
            this.archive.removeEntry(entry.name);
            this.archive.addEntry(entry.name, new Uint8Array(data));
            
            this.filteredEntries = [...this.archive.entries];
            this.ui.updateFileList(this.filteredEntries);
            this.ui.updateUI();
            this.ui.setStatus(`Replaced ${entry.name}`);
            
            this.ui.showMessage('Replace Complete', `Successfully replaced '${entry.name}'`, 'info');
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to replace ${entry.name}: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Rename operation
    renameEntry(entry) {
        if (!this.archive || !entry) return;
        
        this.ui.showInput(
            'Rename Entry',
            'Enter new name:',
            entry.name,
            (newName) => this._doRenameEntry(entry, newName)
        );
    }

    async _doRenameEntry(entry, newName) {
        if (!newName || newName === entry.name) return;
        
        if (newName.length > IMGEntry.MAX_NAME_LENGTH) {
            this.ui.showMessage('Invalid Name', `Entry name cannot exceed ${IMGEntry.MAX_NAME_LENGTH} characters.`, 'error');
            return;
        }
        
        if (this.archive.containsEntry(newName)) {
            this.ui.showMessage('Name Exists', `An entry named '${newName}' already exists in the archive.`, 'error');
            return;
        }
        
        try {
            this.ui.showLoading(`Renaming ${entry.name} to ${newName}...`);
            
            this.archive.renameEntry(entry.name, newName);
            
            this.filteredEntries = [...this.archive.entries];
            this.ui.updateFileList(this.filteredEntries);
            this.ui.updateUI();
            this.ui.setStatus(`Renamed to ${newName}`);
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to rename: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Pack archive
    packArchive() {
        if (!this.archive) return;
        
        this.ui.showConfirm(
            'Pack Archive',
            'Pack the archive to remove unused space?',
            'This will defragment the archive and may reduce file size.',
            'question',
            () => this._doPackArchive(),
            null,
            'Pack',
            'Cancel'
        );
    }

    async _doPackArchive() {
        if (!this.archive) return;
        
        try {
            this.ui.showLoading('Packing archive...');
            
            const newSize = this.archive.pack();
            
            this.filteredEntries = [...this.archive.entries];
            this.ui.updateFileList(this.filteredEntries);
            this.ui.updateUI();
            this.ui.setStatus(`Archive packed to ${newSize} blocks`);
        } catch (error) {
            console.error(error);
            this.ui.showMessage('Error', `Failed to pack archive: ${error.message}`, 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Refresh
    refresh() {
        if (!this.archive) return;
        
        if (this.archive.hasUnsavedChanges) {
            this.ui.showConfirm(
                'Unsaved Changes',
                'Refreshing will reload the archive from disk and discard any unsaved changes.',
                'Do you want to continue?',
                'warning',
                () => this._doRefresh(),
                null,
                'Refresh',
                'Cancel'
            );
        } else {
            this._doRefresh();
        }
    }

    _doRefresh() {
        // In a web app, we can't reload from disk without re-uploading
        // This is a placeholder
        this.ui.setStatus('Refreshed');
    }

    // Filter entries
    filterEntries(filter) {
        if (!this.archive) return;
        
        if (!filter) {
            this.filteredEntries = [...this.archive.entries];
        } else {
            const lowerFilter = filter.toLowerCase();
            this.filteredEntries = this.archive.entries.filter(e => 
                e.name.toLowerCase().includes(lowerFilter)
            );
        }
        
        this.ui.updateFileList(this.filteredEntries);
    }

    // Utility
    _readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GtaImgToolApp();
});