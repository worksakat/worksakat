// ==UserScript==
// @name         SPAIN AUTO DATE TIME,
// @namespace    Violentmonkey Scripts
// @match        https://appointment.thespainvisa.com/*
// @match        https://ita-pak.blsinternational.com/Global/*
// @grant        none
// @version      5.0
// @description  Hyper-fast auto date-time booking with aggressive precision
// ==/UserScript==

(function () {
    'use strict';
    console.log("🚀 [AUTO-BOOKER] Initialized - Nuclear Mode Engaged");

    let selectedDates = [];

    const waitFor = (fn, check, maxAttempts = 100, delay = 20) => {
        let attempts = 0;
        const loop = () => {
            const result = check();
            if (result) {
                fn(result);
            } else if (attempts++ < maxAttempts) {
                requestAnimationFrame(loop);
            } else {
                console.warn("⏱️ Timeout waiting for element");
            }
        };
        loop();
    };

    const humanClick = el => {
        if (!el || el.offsetParent === null) return;
        const rect = el.getBoundingClientRect();
        const opts = { bubbles: true, cancelable: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        ['mousedown', 'mouseup', 'click'].forEach(evt => el.dispatchEvent(new MouseEvent(evt, opts)));
        el.focus();
    };

    const getVisible = selector => [...document.querySelectorAll(selector)].find(el => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');

    const waitForOverlayGone = (cb, retry = 0) => {
        const loader = document.querySelector('.global-overlay-loader');
        if (!loader || loader.offsetParent === null) {
            cb();
        } else if (retry < 50) {
            requestAnimationFrame(() => waitForOverlayGone(cb, retry + 1));
        } else {
            console.warn("⚠️ Loader timeout, continuing...");
            cb();
        }
    };

    const openCalendar = () => {
        const calendarBtn = getVisible('span.k-icon.k-i-calendar')?.closest('span[role="button"]');
        if (calendarBtn) {
            humanClick(calendarBtn);
            console.log("📅 Calendar opened");
            setTimeout(selectDate, 20);
        } else {
            requestAnimationFrame(openCalendar);
        }
    };

    const selectDate = () => {
        const dates = [...document.querySelectorAll('a.k-link[data-value]')].filter(el =>
            !el.closest('td')?.classList.contains('k-state-disabled') &&
            el.offsetParent !== null &&
            !selectedDates.includes(el.dataset.value)
        );

        if (dates.length > 0) {
            const pick = dates[Math.floor(Math.random() * dates.length)];
            selectedDates.push(pick.dataset.value);
            humanClick(pick);
            ['input', 'change'].forEach(e => pick.dispatchEvent(new Event(e, { bubbles: true })));
            console.log("✅ Date selected:", pick.dataset.value);
            waitForOverlayGone(() => setTimeout(openTimeDropdown, 10));
        } else {
            const nextBtn = getVisible('.k-nav-next');
            if (nextBtn) {
                humanClick(nextBtn);
                setTimeout(selectDate, 20);
            } else {
                console.warn("⏭️ No next month button found");
            }
        }
    };

    const openTimeDropdown = (retry = 0) => {
        const dropdown = [...document.querySelectorAll('span.k-dropdown-wrap')].find(el =>
            el.querySelector('.k-input')?.textContent.includes('--Select--') && el.offsetParent !== null
        );
        if (dropdown) {
            const icon = dropdown.querySelector('.k-select');
            humanClick(icon);
            console.log("🕓 Time dropdown opened");
            setTimeout(selectTimeSlot, 10);
        } else if (retry < 10) {
            setTimeout(() => openTimeDropdown(retry + 1), 10);
        } else {
            console.warn("❌ Time dropdown failed to open");
        }
    };

    const selectTimeSlot = (retry = 0) => {
        const slots = [...document.querySelectorAll('.slot-item.bg-success')].filter(el => el.offsetParent !== null);
        if (slots.length > 0) {
            const slot = slots[Math.floor(Math.random() * slots.length)];
            humanClick(slot);
            slot.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("⏱ Time slot picked:", slot.textContent.trim());
            setTimeout(submitForm, 50);
        } else if (retry < 10) {
            setTimeout(() => {
                openTimeDropdown(); // Refresh dropdown
                selectTimeSlot(retry + 1);
            }, 40);
        } else {
            console.warn("❌ No slots after retries");
        }
    };

    const submitForm = () => {
        const btn = document.getElementById('btnSubmit');
        if (btn && btn.offsetParent !== null) {
            humanClick(btn);
            console.log("🚀 Form submitted!");
        } else {
            console.warn("❌ Submit button not ready. Retrying...");
            setTimeout(submitForm, 50);
        }
    };

    window.addEventListener('load', () => {
        console.log("🔥 DOM Ready. Starting full automation...");
        openCalendar();
    });
})();
