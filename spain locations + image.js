// ==UserScript==
// @name         SPAIN LOCATIONS + IMAGE
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Combines autofill + fast image upload with custom UI panels
// @match        https://appointment.thespainvisa.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 🛠 CONFIG KEYS
    const LOCAL_STORAGE_KEY = 'spainVisaFormConfig';
    const IMAGE_URL_KEY = 'spainVisaImageURL';
    const DEFAULT_IMAGE_URL = 'https://i.postimg.cc/XvcXTvMm/jmn.png';

    // 🔄 LOAD CONFIGS
    const getFormConfig = () => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {
        categoryIndex: 0,
        formLocationIndex: 0,
        visaTypeIndex: 1,
        visaSubTypeIndex: 1,
        missionIndex: 0,
        autoSubmit: false
    };
    const setFormConfig = (newConfig) => {
        const updated = { ...getFormConfig(), ...newConfig };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        updateButtonStyles();
    };
    const getImageURL = () => localStorage.getItem(IMAGE_URL_KEY) || DEFAULT_IMAGE_URL;
    const setImageURL = (url) => localStorage.setItem(IMAGE_URL_KEY, url);

    // 🎨 UPDATE STYLES
    const updateButtonStyles = () => {
        const config = getFormConfig();
        document.querySelectorAll('[data-key]').forEach(btn => {
            const key = btn.dataset.key;
            const value = parseInt(btn.dataset.value, 10);
            const selected = config[key] === value;
            btn.style.backgroundColor = selected ? '#28a745' : '';
            btn.style.color = selected ? 'white' : '';
        });
    };

    // 🔘 CREATE BUTTON
    const createButton = (key, value, text) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.dataset.key = key;
        btn.dataset.value = value;
        btn.style.margin = '2px';
        btn.onclick = () => setFormConfig({ [key]: value });
        return btn;
    };

    // 🧩 CONTROL PANEL (MERGED)
    const createMergedControlPanel = () => {
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            backgroundColor: '#fff',
            border: '2px solid #333',
            padding: '10px',
            zIndex: 9999,
            fontSize: '14px',
            fontFamily: 'Arial',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)'
        });

        panel.innerHTML = `<strong>Visa Autofill + Image Upload</strong><br><br>`;

        const sections = [
            ['categoryIndex', ['Normal']],
            ['formLocationIndex', ['Islamabad', 'Karachi', 'Lahore']],
            ['visaTypeIndex', ['EU', 'National', 'Schengen']],
            ['visaSubTypeIndex', ['Family Reunion', 'Other National', 'Study', 'Work', '', '', '', 'Tourist']],
            ['missionIndex', ['Mission 0']]
        ];

        for (const [key, options] of sections) {
            const div = document.createElement('div');
            div.innerHTML = `<b>${key.replace('Index', '').replace(/([A-Z])/g, ' $1')}:</b><br>`;
            options.forEach((text, i) => {
                if (!text) return;
                div.appendChild(createButton(key, i, text));
            });
            panel.appendChild(div);
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'autoSubmitToggle';
        checkbox.checked = getFormConfig().autoSubmit;
        checkbox.onchange = () => setFormConfig({ autoSubmit: checkbox.checked });

        const label = document.createElement('label');
        label.append(checkbox, ' Auto Submit');
        panel.appendChild(document.createElement('br'));
        panel.appendChild(label);

        panel.appendChild(document.createElement('hr'));

        // 🖼️ Image Upload UI
        const imageLabel = document.createElement('label');
        imageLabel.textContent = '📷 Image URL:';
        panel.appendChild(imageLabel);
        panel.appendChild(document.createElement('br'));

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.id = 'customImageURL';
        urlInput.value = getImageURL();
        Object.assign(urlInput.style, { width: '200px', margin: '5px 0', padding: '4px' });
        panel.appendChild(urlInput);

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.padding = '4px 10px';
        saveButton.style.marginTop = '4px';

        const saveNotice = document.createElement('span');
        saveNotice.style.marginLeft = '10px';
        saveNotice.style.color = 'green';
        saveNotice.style.fontSize = '12px';
        saveNotice.style.display = 'none';
        saveNotice.textContent = '✅ Saved';

        saveButton.onclick = () => {
            const url = urlInput.value.trim();
            if (url) {
                setImageURL(url);
                saveNotice.style.display = 'inline';
                setTimeout(() => saveNotice.style.display = 'none', 2000);
            }
        };

        panel.appendChild(saveButton);
        panel.appendChild(saveNotice);

        document.body.appendChild(panel);
        updateButtonStyles();
    };

    // ⚡ FAST ELEMENT WAITER
    const waitForElementFast = (selector, timeout = 5000) => {
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
    };

    const selectOptionByIndex = (dropdown, listboxSelector, index) => {
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
    };

    // 🧠 AUTO FILL FORM
    const autoFillForm = async () => {
        const config = getFormConfig();
        try {
            await waitForElementFast('form .mb-3');

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
            if (fields.category) tasks.push(selectOptionByIndex(fields.category.dropdown, fields.category.listbox, config.categoryIndex));
            if (fields.location) tasks.push(selectOptionByIndex(fields.location.dropdown, fields.location.listbox, config.formLocationIndex));
            if (fields.visaType) tasks.push(selectOptionByIndex(fields.visaType.dropdown, fields.visaType.listbox, config.visaTypeIndex));
            if (fields.visaSubType) tasks.push(selectOptionByIndex(fields.visaSubType.dropdown, fields.visaSubType.listbox, config.visaSubTypeIndex));
            if (fields.mission) tasks.push(selectOptionByIndex(fields.mission.dropdown, fields.mission.listbox, config.missionIndex));

            await Promise.all(tasks);

            if (config.autoSubmit) {
                const submit = document.evaluate('/html/body/main/div/div[2]/div[1]/div[2]/form/div[2]/div[31]/button', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (submit) submit.click();
            }

        } catch (err) {
            console.error('AutoFill Error:', err);
        }
    };

    // 🧠 IMAGE UPLOAD LOGIC
    const fastUploadImage = () => {
        const imageUrl = getImageURL();
        const xhr = new XMLHttpRequest();
        xhr.open("GET", imageUrl, true);
        xhr.responseType = "blob";
        xhr.onload = function () {
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
    };

    const fastClick = (el, delay = 0) => {
        if (!el) return false;
        setTimeout(() => {
            el.style.display = 'block';
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            el.click();
        }, delay);
        return true;
    };

    const handleConsentAndNavigation = () => {
        const checkbox = document.evaluate('/html/body/div[6]/div/input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (checkbox) fastClick(checkbox);

        const tryConsent = () => {
            const consentBtn = document.querySelector('button.btn.btn-primary[data-bs-dismiss="modal"][onclick="return onTermsAgree();"]');
            if (consentBtn && !consentBtn.disabled) fastClick(consentBtn, 300);
            else setTimeout(tryConsent, 100);
        };
        setTimeout(tryConsent, 500);

        const nav = () => {
            if (/changepassword|home\/index/i.test(location.href)) {
                const link = document.querySelector('a.nav-link.new-app-active[href="/Global/appointment/newappointment"]');
                fastClick(link);
            } else if (/PendingAppointment/i.test(location.href)) {
                const btn = [...document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]')]
                    .find(b => b.textContent.trim() === "Book New Appointment");
                fastClick(btn);
            }
            const tryAgain = [...document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]')]
                .find(b => b.textContent.trim() === "Try Again");
            fastClick(tryAgain);
        };
        nav();

        const login = () => {
            const now = Date.now();
            const last = localStorage.getItem('lastLoginClickTime');
            if (last && (now - last < 30000)) return;
            const loginBtn = document.querySelector('span.text-secondary.bg-light.rounded-3.p-2.fw-bold.login-link');
            if (fastClick(loginBtn, 100)) localStorage.setItem('lastLoginClickTime', now.toString());
            else setTimeout(login, 50);
        };
        login();
    };

    // ▶️ RUN
    createMergedControlPanel();
    autoFillForm();
    handleConsentAndNavigation();

    const observer = new MutationObserver(() => {
        if (document.getElementById("uploadfile-1-preview")) {
            fastUploadImage();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
