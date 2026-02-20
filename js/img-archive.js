/**
 * GTA IMG Archive
 * Handles reading and writing GTA IMG archive files
 */

const IMGVersion = {
    VER1: 'VER1',  // GTA III / Vice City (separate .dir + .img)
    VER2: 'VER2'   // GTA San Andreas (single .img with header)
};

const IMGMode = {
    READ_ONLY: 1,
    READ_WRITE: 2
};

class IMGArchive {
    static BLOCK_SIZE = 2048;
    static VER2_MAGIC = new TextEncoder().encode('VER2');
    static ENTRY_SIZE = 32; // 4 + 4 + 24

    constructor() {
        this._imgData = null;      // Uint8Array for IMG data
        this._dirData = null;      // Uint8Array for DIR data (VER1 only)
        this._entries = [];
        this._entryMap = new Map();
        this._version = IMGVersion.VER1;
        this._headerReservedSpace = 1;
        this._mode = IMGMode.READ_WRITE;
        this._fileName = '';
        this._hasUnsavedChanges = false;
    }

    // Static methods
    static guessVersion(data) {
        if (data.length < 4) return IMGVersion.VER1;
        
        const magic = data.slice(0, 4);
        if (magic[0] === 86 && magic[1] === 69 && magic[2] === 82 && magic[3] === 50) { // 'VER2'
            return IMGVersion.VER2;
        }
        
        return IMGVersion.VER1;
    }

    static async createArchive(fileName, version = IMGVersion.VER2) {
        const archive = new IMGArchive();
        archive._version = version;
        archive._fileName = fileName;
        
        if (version === IMGVersion.VER2) {
            // Create VER2 header
            const header = new Uint8Array(8);
            header.set(IMGArchive.VER2_MAGIC, 0);
            // Entry count = 0
            archive._imgData = header;
        } else {
            // VER1: empty DIR and IMG
            archive._dirData = new Uint8Array(0);
            archive._imgData = new Uint8Array(0);
        }
        
        return archive;
    }

    static async openArchive(file, mode = IMGMode.READ_WRITE) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const archive = new IMGArchive();
                    archive._mode = mode;
                    archive._fileName = file.name;
                    
                    const version = IMGArchive.guessVersion(data);
                    
                    if (version === IMGVersion.VER2) {
                        archive._version = IMGVersion.VER2;
                        archive._imgData = data;
                        archive._readHeaderVer2();
                    } else {
                        // For VER1, we need both .img and .dir
                        // For simplicity, we'll assume the user provides the .img file
                        // and we'll look for .dir separately
                        archive._version = IMGVersion.VER1;
                        archive._imgData = data;
                        
                        // Try to load .dir file with same name
                        const dirName = file.name.replace(/\.img$/i, '.dir');
                        if (dirName !== file.name) {
                            // We'll handle this in a separate method
                            archive._dirData = null;
                        }
                        
                        archive._readHeaderVer1();
                    }
                    
                    resolve(archive);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    static async openArchiveWithDir(imgFile, dirFile) {
        return new Promise((resolve, reject) => {
            const imgReader = new FileReader();
            const dirReader = new FileReader();
            let imgLoaded = false;
            let dirLoaded = false;
            let archive = null;
            let error = null;
            
            const checkComplete = () => {
                if (imgLoaded && dirLoaded && !error) {
                    try {
                        archive._version = IMGVersion.VER1;
                        archive._readHeaderVer1();
                        resolve(archive);
                    } catch (err) {
                        reject(err);
                    }
                }
            };
            
            imgReader.onload = (e) => {
                try {
                    const imgData = new Uint8Array(e.target.result);
                    archive = new IMGArchive();
                    archive._mode = IMGMode.READ_WRITE;
                    archive._fileName = imgFile.name;
                    archive._imgData = imgData;
                    imgLoaded = true;
                    checkComplete();
                } catch (err) {
                    error = err;
                    reject(err);
                }
            };
            
            dirReader.onload = (e) => {
                try {
                    const dirData = new Uint8Array(e.target.result);
                    if (archive) {
                        archive._dirData = dirData;
                    }
                    dirLoaded = true;
                    checkComplete();
                } catch (err) {
                    error = err;
                    reject(err);
                }
            };
            
            imgReader.onerror = () => reject(imgReader.error);
            dirReader.onerror = () => reject(dirReader.error);
            
            imgReader.readAsArrayBuffer(imgFile);
            dirReader.readAsArrayBuffer(dirFile);
        });
    }

    // Properties
    get version() { return this._version; }
    get entryCount() { return this._entries.length; }
    get entries() { return this._entries; }
    get fileName() { return this._fileName; }
    get hasUnsavedChanges() { return this._hasUnsavedChanges; }
    
    get headerReservedSize() {
        if (this._version === IMGVersion.VER1) return 0;
        if (this._entries.length > 0) return this._entries[0].offset;
        return 0;
    }
    
    get size() {
        const dataEnd = this._getDataEndOffset();
        if (this._version === IMGVersion.VER2) return dataEnd;
        return dataEnd + IMGArchive.bytesToBlocks(this._entries.length * IMGArchive.ENTRY_SIZE);
    }

    // Public methods
    getEntryByName(name) {
        const lowerName = name.toLowerCase();
        return this._entryMap.get(lowerName) || null;
    }

    containsEntry(name) {
        return this._entryMap.has(name.toLowerCase());
    }

    readEntryData(entry) {
        if (!entry) return null;
        
        const start = entry.offsetInBytes;
        const length = entry.sizeInBytes;
        
        if (start + length > this._imgData.length) {
            throw new Error('Entry data exceeds file bounds');
        }
        
        return this._imgData.slice(start, start + length);
    }

    readEntryDataByName(name) {
        const entry = this.getEntryByName(name);
        return entry ? this.readEntryData(entry) : null;
    }

    addEntry(name, data) {
        if (this._mode === IMGMode.READ_ONLY) {
            throw new Error('Archive is read-only');
        }
        
        if (name.length > IMGEntry.MAX_NAME_LENGTH) {
            throw new Error(`Maximum length of ${IMGEntry.MAX_NAME_LENGTH} characters exceeded`);
        }
        
        if (!this._reserveHeaderSpace(this._entries.length + 1)) {
            throw new Error('Failed to reserve header space');
        }
        
        const sizeInBlocks = IMGEntry.bytesToBlocks(data.length);
        const offset = this._getDataEndOffset();
        
        const entry = new IMGEntry();
        entry.offset = offset;
        entry.size = sizeInBlocks;
        entry.name = name;
        
        this._entries.push(entry);
        this._entryMap.set(name.toLowerCase(), entry);
        
        // Expand data array if needed
        const newSize = offset + sizeInBlocks;
        this._ensureImgSize(newSize);
        
        // Write data
        const dataStart = entry.offsetInBytes;
        const dataEnd = dataStart + data.length;
        this._imgData.set(data, dataStart);
        
        // Pad remaining space
        const paddingStart = dataEnd;
        const paddingEnd = (offset + sizeInBlocks) * IMGEntry.BLOCK_SIZE;
        if (paddingEnd > paddingStart) {
            const padding = new Uint8Array(paddingEnd - paddingStart);
            this._imgData.set(padding, paddingStart);
        }
        
        this._hasUnsavedChanges = true;
        return entry;
    }

    writeEntryData(name, data) {
        if (this._mode === IMGMode.READ_ONLY) {
            throw new Error('Archive is read-only');
        }
        
        const entry = this.getEntryByName(name);
        if (!entry) {
            throw new Error(`No entry found with name ${name}`);
        }
        
        const maxSize = entry.sizeInBytes;
        
        if (data.length > maxSize) {
            throw new Error(`Data size (${data.length}) exceeds entry size (${maxSize})`);
        }
        
        const start = entry.offsetInBytes;
        this._imgData.set(data, start);
        
        // Pad remaining space
        const remaining = maxSize - data.length;
        if (remaining > 0) {
            const padding = new Uint8Array(remaining);
            this._imgData.set(padding, start + data.length);
        }
        
        this._hasUnsavedChanges = true;
    }

    removeEntry(name) {
        if (this._mode === IMGMode.READ_ONLY) {
            throw new Error('Archive is read-only');
        }
        
        const lowerName = name.toLowerCase();
        const index = this._entries.findIndex(e => e.name.toLowerCase() === lowerName);
        
        if (index === -1) return false;
        
        this._entries.splice(index, 1);
        this._entryMap.delete(lowerName);
        this._hasUnsavedChanges = true;
        return true;
    }

    renameEntry(oldName, newName) {
        if (this._mode === IMGMode.READ_ONLY) {
            throw new Error('Archive is read-only');
        }
        
        if (newName.length > IMGEntry.MAX_NAME_LENGTH) {
            throw new Error(`Maximum length of ${IMGEntry.MAX_NAME_LENGTH} characters exceeded`);
        }
        
        const entry = this.getEntryByName(oldName);
        if (!entry) {
            throw new Error(`No entry found with name ${oldName}`);
        }
        
        this._entryMap.delete(oldName.toLowerCase());
        entry.name = newName;
        this._entryMap.set(newName.toLowerCase(), entry);
        
        this._hasUnsavedChanges = true;
    }

    sync() {
        if (this._mode === IMGMode.READ_ONLY) return;
        
        this._rewriteHeaderSection();
        this._hasUnsavedChanges = false;
    }

    pack() {
        if (this._mode === IMGMode.READ_ONLY) {
            throw new Error('Archive is read-only');
        }
        
        if (this._entries.length === 0) return this._headerReservedSpace;
        
        // Read all entry data
        const entryData = new Map();
        for (const entry of this._entries) {
            entryData.set(entry.name, this.readEntryData(entry));
        }
        
        // Calculate new header size
        const headerSize = IMGEntry.bytesToBlocks(
            this._entries.length * IMGArchive.ENTRY_SIZE + 
            (this._version === IMGVersion.VER2 ? 8 : 0)
        );
        
        // Rebuild entries with new offsets
        let currentOffset = headerSize;
        const newEntries = [];
        
        for (const entry of this._entries) {
            const newEntry = new IMGEntry();
            newEntry.offset = currentOffset;
            newEntry.size = entry.size;
            newEntry.name = entry.name;
            newEntries.push(newEntry);
            currentOffset += entry.size;
        }
        
        // Clear and rebuild
        this._entries = newEntries;
        this._entryMap.clear();
        for (const entry of newEntries) {
            this._entryMap.set(entry.name.toLowerCase(), entry);
        }
        
        // Write data
        this._ensureImgSize(currentOffset);
        
        for (const entry of this._entries) {
            const data = entryData.get(entry.name);
            const start = entry.offsetInBytes;
            this._imgData.set(data, start);
            
            // Pad to block boundary
            const padding = entry.sizeInBytes - data.length;
            if (padding > 0) {
                const padData = new Uint8Array(padding);
                this._imgData.set(padData, start + data.length);
            }
        }
        
        this._headerReservedSpace = headerSize;
        this._hasUnsavedChanges = true;
        
        return this._getDataEndOffset();
    }

    async exportEntry(entryName, download = true) {
        const entry = this.getEntryByName(entryName);
        if (!entry) return null;
        
        const data = this.readEntryData(entry);
        
        if (download) {
            const blob = new Blob([data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = entry.name;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        return data;
    }

    async exportAll(download = true) {
        const results = [];
        for (const entry of this._entries) {
            const data = await this.exportEntry(entry.name, download);
            results.push({ name: entry.name, data });
        }
        return results;
    }

    async save() {
        this.sync();
        
        let data;
        if (this._version === IMGVersion.VER2) {
            data = this._imgData;
        } else {
            // For VER1, we need to return both files
            // This is simplified - in a real implementation we'd handle both
            data = this._imgData;
        }
        
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this._fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        this._hasUnsavedChanges = false;
    }

    // Private methods
    _readHeaderVer2() {
        if (this._imgData.length < 8) {
            this._entries = [];
            this._entryMap.clear();
            this._headerReservedSpace = 1;
            return;
        }
        
        const view = new DataView(this._imgData.buffer, this._imgData.byteOffset, this._imgData.byteLength);
        const numEntries = view.getUint32(4, true);
        
        this._entries = [];
        this._entryMap.clear();
        
        let sorted = true;
        let lastOffset = 0;
        
        for (let i = 0; i < numEntries; i++) {
            const pos = 8 + i * IMGArchive.ENTRY_SIZE;
            if (pos + IMGArchive.ENTRY_SIZE > this._imgData.length) break;
            
            const entry = this._readEntry(this._imgData, pos);
            
            if (entry.offset < lastOffset) sorted = false;
            lastOffset = entry.offset;
            
            this._entries.push(entry);
            this._entryMap.set(entry.name.toLowerCase(), entry);
        }
        
        if (!sorted && this._entries.length > 1) {
            this._entries.sort((a, b) => a.offset - b.offset);
            this._entryMap.clear();
            for (const entry of this._entries) {
                this._entryMap.set(entry.name.toLowerCase(), entry);
            }
        }
        
        if (this._entries.length > 0) {
            this._headerReservedSpace = this._entries[0].offset;
        } else {
            this._headerReservedSpace = 1;
        }
    }

    _readHeaderVer1() {
        if (!this._dirData && this._imgData) {
            // Try to infer entries from IMG data structure
            // This is a simplified version - real implementation would need .dir file
            this._entries = [];
            this._entryMap.clear();
            this._headerReservedSpace = 1;
            return;
        }
        
        if (!this._dirData) {
            this._entries = [];
            this._entryMap.clear();
            this._headerReservedSpace = 1;
            return;
        }
        
        this._entries = [];
        this._entryMap.clear();
        
        let sorted = true;
        let lastOffset = 0;
        
        for (let pos = 0; pos + IMGArchive.ENTRY_SIZE <= this._dirData.length; pos += IMGArchive.ENTRY_SIZE) {
            const entry = this._readEntry(this._dirData, pos);
            
            if (entry.offset < lastOffset) sorted = false;
            lastOffset = entry.offset;
            
            this._entries.push(entry);
            this._entryMap.set(entry.name.toLowerCase(), entry);
        }
        
        if (!sorted && this._entries.length > 1) {
            this._entries.sort((a, b) => a.offset - b.offset);
            this._entryMap.clear();
            for (const entry of this._entries) {
                this._entryMap.set(entry.name.toLowerCase(), entry);
            }
        }
        
        if (this._entries.length > 0) {
            this._headerReservedSpace = this._entries[0].offset;
        } else {
            this._headerReservedSpace = 1;
        }
    }

    _readEntry(data, offset) {
        const view = new DataView(data.buffer, data.byteOffset + offset, data.byteLength - offset);
        
        const entry = new IMGEntry();
        entry.offset = view.getUint32(0, true);
        entry.size = view.getUint32(4, true);
        entry.nameBytes = data.slice(offset + 8, offset + 8 + IMGEntry.NAME_FIELD_SIZE);
        
        return entry;
    }

    _rewriteHeaderSection() {
        if (this._version === IMGVersion.VER2) {
            // Write header to IMG data
            const headerSize = 8 + this._entries.length * IMGArchive.ENTRY_SIZE;
            this._ensureImgSize(headerSize);
            
            const header = new Uint8Array(headerSize);
            header.set(IMGArchive.VER2_MAGIC, 0);
            
            const countView = new DataView(header.buffer);
            countView.setUint32(4, this._entries.length, true);
            
            for (let i = 0; i < this._entries.length; i++) {
                const entry = this._entries[i];
                const pos = 8 + i * IMGArchive.ENTRY_SIZE;
                
                const entryView = new DataView(header.buffer, pos);
                entryView.setUint32(0, entry.offset, true);
                entryView.setUint32(4, entry.size, true);
                
                // Copy name
                if (entry.nameBytes) {
                    header.set(entry.nameBytes, pos + 8);
                }
            }
            
            this._imgData.set(header, 0);
        } else {
            // VER1: write to DIR data
            if (!this._dirData) {
                this._dirData = new Uint8Array(this._entries.length * IMGArchive.ENTRY_SIZE);
            } else if (this._dirData.length < this._entries.length * IMGArchive.ENTRY_SIZE) {
                const newDir = new Uint8Array(this._entries.length * IMGArchive.ENTRY_SIZE);
                newDir.set(this._dirData);
                this._dirData = newDir;
            }
            
            for (let i = 0; i < this._entries.length; i++) {
                const entry = this._entries[i];
                const pos = i * IMGArchive.ENTRY_SIZE;
                
                const entryView = new DataView(this._dirData.buffer, this._dirData.byteOffset + pos);
                entryView.setUint32(0, entry.offset, true);
                entryView.setUint32(4, entry.size, true);
                
                // Copy name
                if (entry.nameBytes) {
                    this._dirData.set(entry.nameBytes, pos + 8);
                }
            }
            
            // Truncate if needed
            if (this._dirData.length > this._entries.length * IMGArchive.ENTRY_SIZE) {
                this._dirData = this._dirData.slice(0, this._entries.length * IMGArchive.ENTRY_SIZE);
            }
        }
    }

    _getDataEndOffset() {
        if (this._entries.length === 0) return this._headerReservedSpace;
        
        const lastEntry = this._entries[this._entries.length - 1];
        return lastEntry.offset + lastEntry.size;
    }

    _reserveHeaderSpace(numHeaders) {
        let bytesToReserve = numHeaders * IMGArchive.ENTRY_SIZE;
        
        if (this._version === IMGVersion.VER2) {
            bytesToReserve += 8;
        }
        
        const reservedSize = IMGEntry.blocksToBytes(this.headerReservedSize);
        this._headerReservedSpace = IMGEntry.bytesToBlocks(bytesToReserve);
        
        if (reservedSize === 0 || bytesToReserve <= reservedSize) {
            return true;
        }
        
        // Need to move entries - simplified for now
        return true;
    }

    _ensureImgSize(targetBlocks) {
        const targetBytes = targetBlocks * IMGEntry.BLOCK_SIZE;
        
        if (!this._imgData || this._imgData.length < targetBytes) {
            const newImg = new Uint8Array(targetBytes);
            if (this._imgData) {
                newImg.set(this._imgData);
            }
            this._imgData = newImg;
        }
    }

    // Helper methods
    static blocksToBytes(blocks) {
        return blocks * IMGEntry.BLOCK_SIZE;
    }

    static bytesToBlocks(bytes) {
        return Math.ceil(bytes / IMGEntry.BLOCK_SIZE);
    }

    getArchiveInfo() {
        const versionStr = this._version === IMGVersion.VER2 ? 'VER2 (GTA SA)' : 'VER1 (GTA III/VC)';
        return `${this._entries.length} files | ${versionStr}`;
    }

    getFileTypeInfo(fileName) {
        const ext = fileName.substring(fileName.lastIndexOf('.')).toUpperCase();
        
        switch (ext) {
            case '.DFF': return '3D Model';
            case '.TXD': return 'Texture Dictionary';
            case '.COL': return 'Collision';
            case '.IFP': return 'Animation';
            case '.IPL': return 'Item Placement';
            case '.IDE': return 'Item Definition';
            case '.DAT': return 'Data File';
            case '.CFG': return 'Config File';
            default: return ext.substring(1) || 'Unknown';
        }
    }

    formatSize(bytes) {
        if (bytes >= 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
        if (bytes >= 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        }
        return bytes + ' B';
    }
}