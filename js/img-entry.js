/**
 * GTA IMG Entry
 * Represents a single entry in an IMG archive
 */

class IMGEntry {
    static MAX_NAME_LENGTH = 23;
    static NAME_FIELD_SIZE = 24;
    static BLOCK_SIZE = 2048;

    constructor() {
        this.offset = 0;        // Offset in blocks
        this.size = 0;          // Size in blocks
        this.nameBytes = null;   // Raw name bytes (24 bytes)
        this._name = '';
    }

    get name() {
        if (this._name) return this._name;
        
        if (!this.nameBytes) return '';
        
        // Find null terminator
        let length = this.nameBytes.indexOf(0);
        if (length < 0) length = this.nameBytes.length;
        
        return new TextDecoder('ascii').decode(this.nameBytes.slice(0, length));
    }

    set name(value) {
        this._name = value;
        
        if (!this.nameBytes) {
            this.nameBytes = new Uint8Array(IMGEntry.NAME_FIELD_SIZE);
        }
        
        // Clear bytes
        for (let i = 0; i < IMGEntry.NAME_FIELD_SIZE; i++) {
            this.nameBytes[i] = 0;
        }
        
        if (value) {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(value.substring(0, IMGEntry.MAX_NAME_LENGTH));
            this.nameBytes.set(encoded);
        }
    }

    get sizeInBytes() {
        return this.size * IMGEntry.BLOCK_SIZE;
    }

    get offsetInBytes() {
        return this.offset * IMGEntry.BLOCK_SIZE;
    }

    static blocksToBytes(blocks) {
        return blocks * IMGEntry.BLOCK_SIZE;
    }

    static bytesToBlocks(bytes) {
        return Math.ceil(bytes / IMGEntry.BLOCK_SIZE);
    }

    toString() {
        return `${this.name} (Offset: ${this.offset}, Size: ${this.size} blocks)`;
    }

    toJSON() {
        return {
            name: this.name,
            offset: this.offset,
            size: this.size,
            sizeInBytes: this.sizeInBytes
        };
    }
}