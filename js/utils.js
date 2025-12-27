const utils = {
    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = months[date.getMonth()];
        return `${day} ${month} ${date.getFullYear()}`;
    },

    renderDate(dateStr) {
        const formatted = this.formatDate(dateStr);
        if (formatted === '-') return '-';
        return `
            <div class="date-container">
                <span class="date-val">${formatted}</span>
            </div>
        `;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    getUnit(itemName) {
        if (!itemName) return 'Nos';
        const name = itemName.toLowerCase();
        if (name.includes('cable') || name.includes('wire') || name.includes('sq mm')) return 'Metres';
        return 'Nos';
    },
    async sha256(message) {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    formatQuarter(val) {
        if (!val) return val;
        // If it's like F18, C1, SRU5 -> F-18, C-1, SRU-5
        const formatted = val.toUpperCase().trim();
        const match = formatted.match(/^([A-Z]+)(\d+)$/);
        if (match) {
            return `${match[1]}-${match[2]}`;
        }
        return formatted;
    },
    // Storage Optimization: Key Mappings
    keys: {
        'id': 'i',
        'quarter': 'q',
        'remarks': 'r',
        'status': 's',
        'createdAt': 'c',
        'completedAt': 'fa', // finished at
        'technicians': 't',
        'materials': 'm',
        'category': 'cat',
        'item': 'it',
        'quantity': 'qty',
        'unit': 'u',
        'updatedAt': 'ua',
        'uploads': 'ul',
        'indentNo': 'in',
        'items': 'its'
    },
    compress(obj) {
        if (Array.isArray(obj)) return obj.map(o => this.compress(o));
        if (typeof obj !== 'object' || obj === null) return obj;
        const newObj = {};
        for (let k in obj) {
            const newKey = this.keys[k] || k;
            newObj[newKey] = this.compress(obj[k]);
        }
        return newObj;
    },
    decompress(obj) {
        if (Array.isArray(obj)) return obj.map(o => this.decompress(o));
        if (typeof obj !== 'object' || obj === null) return obj;
        const reverseKeys = Object.fromEntries(Object.entries(this.keys).map(([k, v]) => [v, k]));
        const newObj = {};
        for (let k in obj) {
            const oldKey = reverseKeys[k] || k;
            newObj[oldKey] = this.decompress(obj[k]);
        }
        return newObj;
    }
};
