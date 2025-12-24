const settingsModule = {
    render(container) {
        const apiKey = storage.get('gemini_api_key', '');

        container.innerHTML = `
            <div class="form-container">
                <h3>System Settings</h3>
                <p class="text-sm text-muted mb-6">Manage your API keys and application preferences</p>
                
                <div class="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 mb-6">
                    <div class="flex items-center gap-3 mb-4 text-primary">
                        <i data-lucide="sparkles"></i>
                        <h4 class="font-bold">Gemini AI Configuration</h4>
                    </div>
                    
                    <div class="form-group mb-4">
                        <label class="flex justify-between">
                            Gemini API Key
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] text-indigo-400 hover:underline">Get key from Google AI Studio</a>
                        </label>
                        <div class="relative">
                            <input type="password" id="gemini-api-key" value="${apiKey}" placeholder="Enter your API key..." class="pr-10">
                            <button type="button" onclick="settingsModule.togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <i data-lucide="eye" size="16"></i>
                            </button>
                        </div>
                        <p class="text-[10px] text-slate-500 mt-2">Required for AI-powered material extraction from remarks.</p>
                    </div>

                    <button onclick="settingsModule.saveApiKey()" class="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        <i data-lucide="save" size="18"></i>
                        Save Configuration
                    </button>
                </div>
                
                <div class="form-actions mt-6">
                    <button onclick="router.navigate('home')" class="btn-secondary w-full">Back to Dashboard</button>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    togglePasswordVisibility() {
        const input = document.getElementById('gemini-api-key');
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    saveApiKey() {
        const key = document.getElementById('gemini-api-key').value.trim();
        storage.set('gemini_api_key', key);
        router.navigate('home');
    }
};
