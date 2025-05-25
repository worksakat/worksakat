// ==UserScript==
// @name         SPAIN AUTO LOCATIONS + IMAGE,
// @namespace    http://tampermonkey.net/
// @version      5.2
// @description  Fixed panel opening with instant updates
// @match        https://appointment.thespainvisa.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 🛠 CONFIG KEYS
    const CONFIG = {
        STORAGE_KEY: 'spainVisaConfig',
        IMAGE_KEY: 'spainVisaImageURL',
        DEFAULT_IMAGE: 'https://i.postimg.cc/XvcXTvMm/jmn.png',
        STATE_KEY: 'spainVisaActive'
    };

    // 🔄 CONFIG MANAGEMENT
    const ConfigManager = {
        getConfig() {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || {
                categoryIndex: 0,
                formLocationIndex: 0,
                visaTypeIndex: 1,
                visaSubTypeIndex: 1,
                missionIndex: 0,
                autoSubmit: false
            };
        },

        updateConfig(updates) {
            const config = {...this.getConfig(), ...updates};
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(config));
            EventBus.dispatch('configUpdated', config);
            return config;
        },

        getImageURL() {
            return localStorage.getItem(CONFIG.IMAGE_KEY) || CONFIG.DEFAULT_IMAGE;
        },

        setImageURL(url) {
            localStorage.setItem(CONFIG.IMAGE_KEY, url);
            UI.showNotification('✅ Image URL saved!');
        },

        getScriptState() {
            return localStorage.getItem(CONFIG.STATE_KEY) === 'true';
        },

        setScriptState(state) {
            localStorage.setItem(CONFIG.STATE_KEY, state.toString());
            EventBus.dispatch('scriptStateChanged', state);
            if (state) ScriptEngine.run();
        }
    };

    // 📡 EVENT BUS FOR REAL-TIME UPDATES
    const EventBus = {
        listeners: {},

        on(event, callback) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(callback);
        },

        dispatch(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => callback(data));
            }
        }
    };

    // 💎 UI COMPONENTS
    const UI = {
        activeButtons: new Map(),
        settingsPanel: null,

        init() {
            this.createMainControls();
            this.setupEventListeners();
            if (ConfigManager.getScriptState()) ScriptEngine.run();
            this.injectStyles();
        },

        createMainControls() {
            const container = document.createElement('div');
            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            });

            // Toggle Button
            this.toggleBtn = this.createControlButton(
                ConfigManager.getScriptState() ? '⏸️ STOP' : '▶️ START',
                ConfigManager.getScriptState() ? '#e74c3c' : '#2ecc71',
                () => ConfigManager.setScriptState(!ConfigManager.getScriptState())
            );
            this.toggleBtn.id = 'scriptToggleBtn';

            // Settings Button
            this.settingsBtn = this.createControlButton(
                '⚙️ SETTINGS',
                '#3498db',
                () => this.toggleSettingsPanel()
            );

            container.appendChild(this.toggleBtn);
            container.appendChild(this.settingsBtn);
            document.body.appendChild(container);
        },

        setupEventListeners() {
            EventBus.on('scriptStateChanged', (state) => {
                this.updateToggleButton(state);
            });

            EventBus.on('configUpdated', (config) => {
                this.updateAllButtonStates(config);
            });
        },

        updateToggleButton(isActive) {
            this.toggleBtn.innerHTML = isActive ? '⏸️ STOP' : '▶️ START';
            this.toggleBtn.style.background = isActive
                ? 'linear-gradient(135deg, rgba(231,76,60,0.8) 0%, rgba(192,57,43,0.9) 100%)'
                : 'linear-gradient(135deg, rgba(46,204,113,0.8) 0%, rgba(39,174,96,0.9) 100%)';
        },

        updateAllButtonStates(config) {
            this.activeButtons.forEach((buttons, key) => {
                const activeIndex = config[key];
                buttons.forEach((btn, index) => {
                    const isActive = index === activeIndex;
                    btn.style.background = isActive
                        ? 'linear-gradient(135deg, rgba(46,204,113,0.9) 0%, rgba(39,174,96,0.9) 100%)'
                        : 'rgba(245,245,245,0.9)';
                    btn.style.color = isActive ? 'white' : '#2c3e50';
                    btn.style.boxShadow = isActive
                        ? '0 4px 12px rgba(39,174,96,0.2)'
                        : '0 2px 8px rgba(0,0,0,0.05)';
                });
            });
        },

        createControlButton(text, bgColor, onClick) {
            const btn = document.createElement('button');
            Object.assign(btn.style, {
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: `linear-gradient(135deg, ${bgColor}99 0%, ${bgColor} 100%)`,
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                backdropFilter: 'blur(10px)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            });
            btn.innerHTML = text;
            btn.onclick = onClick;
            return btn;
        },

        toggleSettingsPanel() {
            if (this.settingsPanel && document.body.contains(this.settingsPanel)) {
                this.settingsPanel.remove();
                this.settingsPanel = null;
            } else {
                this.settingsPanel = this.createSettingsPanel();
                document.body.appendChild(this.settingsPanel);
            }
        },

        createSettingsPanel() {
            const panel = document.createElement('div');
            panel.id = 'settingsPanel';
            Object.assign(panel.style, {
                position: 'fixed',
                top: '80px',
                right: '20px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '20px',
                zIndex: 9998,
                fontSize: '14px',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                width: '340px',
                maxHeight: '80vh',
                overflowY: 'auto',
                backdropFilter: 'blur(12px)'
            });

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            Object.assign(closeBtn.style, {
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#7f8c8d',
                transition: 'all 0.2s'
            });
            closeBtn.onmouseover = () => closeBtn.style.color = '#e74c3c';
            closeBtn.onmouseout = () => closeBtn.style.color = '#7f8c8d';
            closeBtn.onclick = () => this.toggleSettingsPanel();
            panel.appendChild(closeBtn);

            // Header
            panel.appendChild(this.createPanelHeader());

            // Configuration Sections
            const sections = [
                ['categoryIndex', ['Normal']],
                ['formLocationIndex', ['Islamabad', 'Karachi', 'Lahore']],
                ['visaTypeIndex', ['EU', 'National', 'Schengen']],
                ['visaSubTypeIndex', ['Family Reunion', 'Other National', 'Study', 'Work', '', '', '', 'Tourist']],
                ['missionIndex', ['Mission 0']]
            ];

            sections.forEach(([key, options]) => {
                panel.appendChild(this.createOptionSection(key, options));
            });

            // Auto Submit Toggle
            panel.appendChild(this.createAutoSubmitToggle());

            // Image URL Section
            panel.appendChild(this.createImageUrlSection());

            return panel;
        },

        createPanelHeader() {
            const header = document.createElement('div');
            header.innerHTML = `
                <div style="
                    color: #2c3e50;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size:20px">⚙️</span> Settings Panel
                </div>
            `;
            return header;
        },

        createOptionSection(key, options) {
            const div = document.createElement('div');
            div.style.marginBottom = '20px';

            const label = document.createElement('div');
            label.style.fontWeight = '600';
            label.style.marginBottom = '10px';
            label.style.color = '#34495e';
            label.textContent = `${key.replace('Index', '').replace(/([A-Z])/g, ' $1').trim()}:`;
            div.appendChild(label);

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.flexWrap = 'wrap';
            btnContainer.style.gap = '8px';

            const currentValue = ConfigManager.getConfig()[key];
            const buttonGroup = [];

            options.forEach((text, i) => {
                if (!text) return;

                const btn = document.createElement('button');
                btn.textContent = text;

                const isActive = currentValue === i;
                Object.assign(btn.style, {
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: isActive
                        ? 'linear-gradient(135deg, rgba(46,204,113,0.9) 0%, rgba(39,174,96,0.9) 100%)'
                        : 'rgba(245,245,245,0.9)',
                    color: isActive ? 'white' : '#2c3e50',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    boxShadow: isActive
                        ? '0 4px 12px rgba(39,174,96,0.2)'
                        : '0 2px 8px rgba(0,0,0,0.05)',
                    flex: '1 0 auto',
                    minWidth: '80px'
                });

                buttonGroup.push(btn);

                btn.onclick = () => {
                    ConfigManager.updateConfig({ [key]: i });
                };

                btnContainer.appendChild(btn);
            });

            this.activeButtons.set(key, buttonGroup);
            div.appendChild(btnContainer);
            return div;
        },

        createAutoSubmitToggle() {
            const toggleDiv = document.createElement('div');
            toggleDiv.style.margin = '20px 0';
            toggleDiv.style.display = 'flex';
            toggleDiv.style.alignItems = 'center';
            toggleDiv.style.justifyContent = 'space-between';

            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.cursor = 'pointer';
            label.style.gap = '10px';

            const span = document.createElement('span');
            span.textContent = 'Auto Submit Form';
            span.style.fontWeight = '600';
            span.style.color = '#34495e';

            const toggle = document.createElement('div');
            toggle.style.position = 'relative';
            toggle.style.width = '50px';
            toggle.style.height = '26px';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = ConfigManager.getConfig().autoSubmit;
            input.style.opacity = '0';
            input.style.width = '0';
            input.style.height = '0';
            input.style.position = 'absolute';

            const slider = document.createElement('span');
            Object.assign(slider.style, {
                position: 'absolute',
                cursor: 'pointer',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                backgroundColor: ConfigManager.getConfig().autoSubmit ? '#2ecc71' : '#ccc',
                transition: 'all 0.3s',
                borderRadius: '34px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            });

            const knob = document.createElement('span');
            Object.assign(knob.style, {
                position: 'absolute',
                height: '20px',
                width: '20px',
                left: ConfigManager.getConfig().autoSubmit ? '26px' : '4px',
                bottom: '3px',
                backgroundColor: 'white',
                transition: 'all 0.3s',
                borderRadius: '50%',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            });

            input.onchange = () => {
                ConfigManager.updateConfig({ autoSubmit: input.checked });
                slider.style.backgroundColor = input.checked ? '#2ecc71' : '#ccc';
                knob.style.left = input.checked ? '26px' : '4px';
            };

            toggle.appendChild(input);
            toggle.appendChild(slider);
            toggle.appendChild(knob);
            label.appendChild(span);
            label.appendChild(toggle);
            toggleDiv.appendChild(label);
            return toggleDiv;
        },

        createImageUrlSection() {
            const div = document.createElement('div');
            div.style.marginTop = '20px';

            const label = document.createElement('div');
            label.textContent = '📷 Image URL:';
            label.style.fontWeight = '600';
            label.style.marginBottom = '10px';
            label.style.color = '#34495e';
            div.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.value = ConfigManager.getImageURL();
            Object.assign(input.style, {
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)',
                marginBottom: '12px',
                backgroundColor: 'rgba(245,245,245,0.7)',
                transition: 'all 0.2s',
                outline: 'none'
            });
            div.appendChild(input);

            const btn = this.createControlButton(
                '💾 SAVE IMAGE URL',
                '#3498db',
                () => ConfigManager.setImageURL(input.value.trim())
            );
            btn.style.width = '100%';
            div.appendChild(btn);

            return div;
        },

        showNotification(message) {
            const notification = document.createElement('div');
            notification.innerHTML = `<span style="font-size:18px">✓</span> ${message}`;
            Object.assign(notification.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: '#2ecc71',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: '10000',
                animation: 'fadeIn 0.3s',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            });

            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.5s';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        },

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(10px); }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // ⚡ SCRIPT ENGINE
    const ScriptEngine = {
        run() {
            this.autoFillForm();
            this.handleConsentAndNavigation();
            this.setupImageObserver();
        },

        async autoFillForm() {
            const config = ConfigManager.getConfig();
            try {
                await this.waitForElement('form .mb-3');

                const fields = {};
                document.querySelectorAll('form .mb-3').forEach(el => {
                    if (getComputedStyle(el).display === 'none') return;
                    const label = el.querySelector('label');
                    const select = el.querySelector('span.k-select');
                    if (!label || !select) return;
                    const id = label.getAttribute('for');
                    const text = label.textContent.trim();
                    if (text.includes('Category')) fields.category = { dropdown: select, listbox: `#${id}_listbox` };
                    if (text.includes('Location')) fields.location = { dropdown: select, listbox: `#${id}_listbox` };
                    if (text.includes('Visa Type')) fields.visaType = { dropdown: select, listbox: `#${id}_listbox` };
                    if (text.includes('Visa Sub Type')) fields.visaSubType = { dropdown: select, listbox: `#${id}_listbox` };
                    if (text.includes('Mission')) fields.mission = { dropdown: select, listbox: `#${id}_listbox` };
                });

                const tasks = [];
                if (fields.category) tasks.push(this.selectOption(fields.category.dropdown, fields.category.listbox, config.categoryIndex));
                if (fields.location) tasks.push(this.selectOption(fields.location.dropdown, fields.location.listbox, config.formLocationIndex));
                if (fields.visaType) tasks.push(this.selectOption(fields.visaType.dropdown, fields.visaType.listbox, config.visaTypeIndex));
                if (fields.visaSubType) tasks.push(this.selectOption(fields.visaSubType.dropdown, fields.visaSubType.listbox, config.visaSubTypeIndex));
                if (fields.mission) tasks.push(this.selectOption(fields.mission.dropdown, fields.mission.listbox, config.missionIndex));

                await Promise.all(tasks);

                if (config.autoSubmit) {
                    const submit = document.evaluate(
                        '/html/body/main/div/div[2]/div[1]/div[2]/form/div[2]/div[31]/button',
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    if (submit) submit.click();
                }

            } catch (err) {
                console.error('AutoFill Error:', err);
            }
        },

        async selectOption(dropdown, listboxSelector, index) {
            return new Promise(resolve => {
                dropdown.click();
                let tries = 0;
                const pick = () => {
                    const items = document.querySelectorAll(`${listboxSelector} .k-item`);
                    if (items.length && items[index]) {
                        items[index].click();
                        resolve();
                    } else if (tries++ < 200) {
                        setTimeout(pick, 1);
                    } else {
                        resolve();
                    }
                };
                pick();
            });
        },

        handleConsentAndNavigation() {
            const checkbox = document.evaluate(
                '/html/body/div[6]/div/input',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
            if (checkbox) this.fastClick(checkbox);

            const tryConsent = () => {
                const consentBtn = document.querySelector(
                    'button.btn.btn-primary[data-bs-dismiss="modal"][onclick="return onTermsAgree();"]'
                );
                if (consentBtn && !consentBtn.disabled) this.fastClick(consentBtn, 300);
                else setTimeout(tryConsent, 100);
            };
            setTimeout(tryConsent, 500);

            this.navigateToAppointment();
            this.handleLogin();
        },

        navigateToAppointment() {
            if (/changepassword|home\/index/i.test(location.href)) {
                const link = document.querySelector('a.nav-link.new-app-active[href="/Global/appointment/newappointment"]');
                this.fastClick(link);
            } else if (/PendingAppointment/i.test(location.href)) {
                const btn = [...document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]')]
                    .find(b => b.textContent.trim() === "Book New Appointment");
                this.fastClick(btn);
            }
            const tryAgain = [...document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]')]
                .find(b => b.textContent.trim() === "Try Again");
            this.fastClick(tryAgain);
        },

        handleLogin() {
            const now = Date.now();
            const last = localStorage.getItem('lastLoginClickTime');
            if (last && (now - last < 30000)) return;
            const loginBtn = document.querySelector('span.text-secondary.bg-light.rounded-3.p-2.fw-bold.login-link');
            if (this.fastClick(loginBtn, 100)) {
                localStorage.setItem('lastLoginClickTime', now.toString());
            } else {
                setTimeout(this.handleLogin, 50);
            }
        },

        fastClick(el, delay = 0) {
            if (!el) return false;
            setTimeout(() => {
                el.style.display = 'block';
                el.scrollIntoView({ behavior: 'auto', block: 'center' });
                el.click();
            }, delay);
            return true;
        },

        setupImageObserver() {
            const observer = new MutationObserver(() => {
                if (document.getElementById("uploadfile-1-preview")) {
                    this.uploadImage();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        },

        uploadImage() {
            const imageUrl = ConfigManager.getImageURL();
            const xhr = new XMLHttpRequest();
            xhr.open("GET", imageUrl, true);
            xhr.responseType = "blob";
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const fd = new FormData();
                    fd.append('file', xhr.response, "image.jpg");

                    fetch("/Global/query/UploadProfileImage", {
                        method: 'POST',
                        body: fd
                    }).then(r => r.json()).then(result => {
                        if (result.success) {
                            const preview = document.getElementById("uploadfile-1-preview");
                            const photoId = document.getElementById("ApplicantPhotoId");
                            if (preview) preview.src = "/Global/query/getfile?fileid=" + result.fileId;
                            if (photoId) photoId.value = result.fileId;
                        }
                    });
                }
            };
            xhr.send();
        },

        waitForElement(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const start = performance.now();
                const interval = setInterval(() => {
                    const el = document.querySelector(selector);
                    if (el) {
                        clearInterval(interval);
                        resolve(el);
                    } else if (performance.now() - start > timeout) {
                        clearInterval(interval);
                        reject(new Error('Timeout: ' + selector));
                    }
                }, 1);
            });
        }
    };

    // 🚀 INITIALIZE
    UI.init();
})();