const DATA = {
    quarters: [
        { id: 'ab', name: 'A & B' },
        { id: 'c', name: 'C-type', children: Array.from({ length: 9 }, (_, i) => `C-${i + 1}`) },
        { id: 'd', name: 'D-type', children: Array.from({ length: 20 }, (_, i) => `D-${i + 1}`) },
        { id: 'e', name: 'E-type', children: Array.from({ length: 27 }, (_, i) => `E-${i + 1}`) },
        { id: 'f', name: 'F-type', children: Array.from({ length: 52 }, (_, i) => `F-${i + 1}`) },
        { id: 'g', name: 'G-type', children: Array.from({ length: 88 }, (_, i) => `G-${i + 1}`) },
        { id: 'sru', name: 'SRU', children: Array.from({ length: 32 }, (_, i) => `SRU-${i + 1}`) },
        { id: 'dru', name: 'DRU', children: Array.from({ length: 44 }, (_, i) => `DRU-${i + 1}`) },
        { id: 'tru', name: 'TRU', children: Array.from({ length: 12 }, (_, i) => `TRU-${i + 1}`) },
        {
            id: 'pragyan', name: 'Pragyan Hostel', children: [
                ...Array.from({ length: 16 }, (_, i) => `${i + 1}`),
                ...Array.from({ length: 16 }, (_, i) => `${101 + i}`),
                ...Array.from({ length: 16 }, (_, i) => `${201 + i}`),
                ...Array.from({ length: 16 }, (_, i) => `${301 + i}`),
                ...Array.from({ length: 16 }, (_, i) => `${401 + i}`),
                ...Array.from({ length: 16 }, (_, i) => `${501 + i}`)
            ]
        },
        { id: 'pump', name: 'Pump House' },
        { id: 'horticulture', name: 'Horticulture' },
        { id: 'guest', name: 'Guest House', children: ['Abhinandhan G/H', 'Atithi G/H'] },
        { id: 'dispensary', name: 'Dispensary' },
        { id: 'club', name: 'Staff Club' },
        { id: 'school', name: 'ZM High School' }
    ],

    technicians: ['Ramesh', 'Mahesh', 'Venkatesh', 'Sai', 'Santhosh', 'Satish', 'Babu'],

    materials: [
        {
            name: 'Wires/Cables',
            items: ['0.75 sq mm [CU]', '1 sq mm [CU]', '1.5 sq mm [CU]', '2.5 sq mm [CU]', '4 sq mm [CU]', '6 sq mm [CU]', '3C x 0.75 sq mm [CU]', '3C x 1 sq mm [CU]', '3C x 1.5 sq mm [CU]', '3C x 2.5 sq mm [CU]', '4C x 4 sq mm [CU]', '5C x 4 sq mm [CU]'],
            unit: 'Metre'
        },
        {
            name: 'Switches & Sockets',
            items: [
                '6A switch Non modular', '6A Socket non Modular', '16A switch Non modular', '16A Socket non Modular',
                '6A Combinder with Box', '16A Combinder', '16A Combinder with Box', '6M box & Plate', '12M box & Plate',
                '6A Modular Switch', '6A Modular Socket', '16A Modular Switch', '16A Modular Socket'
            ],
            companies: ['ROMA', 'PENTA', 'LEGRAND', 'NORTH-WEST', 'NORISYS'],
            unit: 'Nos'
        },
        {
            name: 'Street Lights',
            items: ['45W Street light', '60W Street light', '70W Street light', '120W Street light'],
            unit: 'Nos'
        },
        {
            name: 'Flood Lights',
            items: ['25W Flood Light', '30W Flood Light', '50W Flood Light', '75W Flood Light', '100W Flood Light', '200W Flood Light', '250W Flood Light'],
            unit: 'Nos'
        },
        {
            name: 'Tube Lights/Tubes/Bulbs',
            items: ['20W Tube light', '20W Tube', '9W Buld', '18W Bulb'],
            unit: 'Nos'
        },
        {
            name: 'AL Cable',
            items: ['3Cx 2.5 sq mm Cable [AL]', '3Cx 4 sq mm Cable [AL]', '3Cx 6 sq mm Cable [AL]'],
            unit: 'Metre'
        },
        {
            name: 'Armoured XLPE Cable',
            items: ['4C x 6 sq mm [XLPE]', '4C x 10 sq mm [XLPE]', '4C x 16 sq mm [XLPE]', '4C x 25 sq mm [XLPE]', '3.5C x 35 sq mm [XLPE]', '3.5C x 50 sq mm [XLPE]'],
            unit: 'Metre'
        },
        {
            name: 'MCB',
            items: ['SP MCB', 'DP MCB', 'TP MCB', 'TPN MCB', 'FP MCB'],
            ratings: ['6A', '10A', '16A', '20A', '25A', '32A', '40A', '60A'],
            unit: 'Nos'
        },
        {
            name: 'MCCB',
            items: ['100A MCCB', '125A MCCB', '200A MCCB', '250A MCCB'],
            unit: 'Nos'
        },
        {
            name: 'DBs',
            items: ['SPN 8 Way double door', 'SPN 12 way double door', 'HDB', 'VTPN'],
            unit: 'Nos'
        },
        {
            name: 'Enclosers',
            items: ['DP encloser', 'TP encloser', 'FP encloser'],
            unit: 'Nos'
        },
        {
            name: 'Casing and Caping',
            items: ['3/4 inch', '1 inch'],
            unit: 'Nos'
        },
        {
            name: 'PVC Pipes',
            items: ['3/4 inch', '1 inch'],
            unit: 'Nos'
        },
        {
            name: 'Colour change Flood lights',
            items: ['50W Colour flood light', '100W Colour flood light'],
            unit: 'Nos'
        },
        {
            name: 'WW flood lights',
            items: ['50W WW flood light', '100W WW flood light'],
            unit: 'Nos'
        },
        {
            name: 'Ceiling Fan',
            items: ['Ceiling Fan New', 'Ceiling Fan Old'],
            unit: 'Nos'
        },
        {
            name: 'Capacitor-2.5MFD',
            items: ['2.5MFD'],
            unit: 'Nos'
        },
        {
            name: 'Post Top Light (Crompton)',
            items: ['Post Top Light'],
            unit: 'Nos'
        },
        {
            name: 'Exhaust fan',
            items: ['Light duty 300 MM [Metal]', 'Heavy Duty 300 MM [Metal]'],
            unit: 'Nos'
        },
        {
            name: 'Starters',
            items: ['DOL Starter', 'Star Delta Starter'],
            phases: ['Single Phase', 'Three Phase'],
            ratings: {
                'DOL Starter': ['0.5 HP Starter', '1 HP Starter', '2 HP Starter', '7.5 HP Starter', '10 HP Starter'],
                'Star Delta Starter': ['15 HP Starter', '25 HP Starter']
            },
            unit: 'Nos'
        },
        {
            name: 'Energy Meter',
            items: ['1PH Energy Meter', '3PH Energy Meter'],
            unit: 'Nos'
        }
    ]
};

const storage = {
    get(key, defaultValue = []) {
        try {
            let val = localStorage.getItem(key);
            if (!val) return defaultValue;

            // All data is stored Base64 encoded for basic obfuscation
            try {
                const decoded = atob(val);
                return JSON.parse(decoded);
            } catch (e) {
                // Fallback for non-encoded legacy data
                try {
                    return JSON.parse(val);
                } catch (e2) {
                    return val || defaultValue;
                }
            }
        } catch (e) {
            return defaultValue;
        }
    },

    set(key, data, skipCloud = false) {
        try {
            const val = JSON.stringify(data);
            localStorage.setItem(key, btoa(val));

            // Sync to Firestore if not explicitly skipped
            if (!skipCloud && window.db) {
                this.pushToCloud(key, data);
            }
        } catch (e) {
            console.error('Storage Set Error:', e);
        }
    },

    async pushToCloud(key, data) {
        if (!['work_orders', 'indents', 'gate_passes', 'tenders'].includes(key)) return;
        try {
            // Compress data for storage efficiency
            const compressed = utils.compress(data);

            // High-level sync: Overwrite the document with the compressed array
            await db.collection('app_data').doc(key).set({
                items: compressed,
                updatedAt: new Date().toISOString(),
                format: 'compressed_v1'
            });
        } catch (e) {
            console.error('Cloud Push Error:', e);
        }
    },

    initRealtimeListeners() {
        if (!window.db) {
            console.warn('Firestore not initialized yet. Waiting for db...');
            return;
        }

        console.log('☁️ Firestore Connection: Active');
        const keys = ['work_orders', 'indents', 'gate_passes', 'tenders'];

        keys.forEach(key => {
            db.collection('app_data').doc(key).onSnapshot(doc => {
                if (doc.exists) {
                    const docData = doc.data();
                    let cloudData = docData.items || [];

                    // Decompress if needed
                    if (docData.format === 'compressed_v1') {
                        cloudData = utils.decompress(cloudData);
                    }

                    const localData = this.get(key);

                    // Only update and re-render if the cloud data is different
                    if (JSON.stringify(cloudData) !== JSON.stringify(localData)) {
                        console.log(`Cloud Sync: ${key} updated from remote`);
                        this.set(key, cloudData, true); // Update local cache but don't push back

                        if (typeof router !== 'undefined') {
                            router.updatePendingCount();
                            // If current view is relevant, re-render
                            const title = document.getElementById('view-title')?.textContent.toLowerCase() || '';
                            if (title.includes(key.split('_')[0]) || (key === 'work_orders' && (title.includes('pending') || title.includes('completed')))) {
                                router.refreshCurrentView();
                            }
                        }
                    }
                }
            }, err => console.error(`Snapshot Error ${key}:`, err));
        });
    },

    downloadBackup() {
        const data = {
            work_orders: this.get('work_orders'),
            indents: this.get('indents'),
            gate_passes: this.get('gate_passes'),
            tenders: this.get('tenders'),
            inventory: this.get('inventory'),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorkOrder_SAFE_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('🛡️ Security: Local data backup generated.');
    },

    async factoryReset() {
        if (!confirm('🛑 CRITICAL ACTION: This will delete ALL data (Work Orders, Indents, Gate Passes, Tenders) permanently from the Cloud and this device. Are you absolutely sure?')) return;

        const secondConfirm = confirm('Please confirm ONE LAST TIME. This cannot be undone.');
        if (!secondConfirm) return;

        try {
            const keys = ['work_orders', 'indents', 'gate_passes', 'tenders', 'inventory'];

            // 1. Clear Local Storage
            keys.forEach(key => localStorage.removeItem(key));

            // 2. Clear Cloud Data
            if (window.db) {
                const cloudKeys = ['work_orders', 'indents', 'gate_passes', 'tenders'];
                for (const key of cloudKeys) {
                    await db.collection('app_data').doc(key).set({ items: [], updatedAt: new Date().toISOString(), status: 'RESET' });
                }
            }

            alert('✅ Application has been reset to factory state. The page will now reload.');
            window.location.reload();
        } catch (e) {
            console.error('Factory Reset Error:', e);
            alert('Error during reset. Please check console.');
        }
    },

    async runMaintenance() {
        if (!auth.isOwner()) return; // Only owner triggers maintenance
        console.log('🧹 Storage Maintenance: Checking for old records...');

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const keys = ['work_orders', 'indents', 'gate_passes', 'tenders'];
        let totalArchived = 0;

        for (const key of keys) {
            const data = this.get(key);
            const toArchive = data.filter(item => {
                const date = new Date(item.completedAt || item.createdAt);
                return date < sixMonthsAgo && (item.status === 'completed' || item.status === 'archived');
            });

            if (toArchive.length > 0) {
                console.log(`📦 Archiving ${toArchive.length} items from ${key}`);
                const remaining = data.filter(item => !toArchive.includes(item));

                // Move to Archive Collection
                await this.archiveData(key, toArchive);

                // Update active collection
                this.set(key, remaining);
                totalArchived += toArchive.length;
            }
        }

        if (totalArchived > 0) {
            console.log(`✅ Maintenance Complete: ${totalArchived} items archived.`);
        }
    },

    async archiveData(key, items) {
        try {
            // Compressed for archival as well
            const compressed = utils.compress(items);
            const archiveId = `${key}_${new Date().getFullYear()}_${Math.floor(new Date().getMonth() / 3)}`; // Quarterly archives

            await db.collection('archived_data').doc(archiveId).set({
                items: firebase.firestore.FieldValue.arrayUnion(...compressed),
                key,
                period: archiveId.split('_').slice(1).join('-'),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error('Archive Error:', e);
        }
    }
};
