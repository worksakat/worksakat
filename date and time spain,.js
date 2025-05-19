// ==UserScript==
// @name         AUTO DATE AND TIME SPAIN,
// @namespace    Violentmonkey Scripts
// @match        https://appointment.thespainvisa.com/*
// @match        https://ita-pak.blsinternational.com/Global/*
// @grant        none
// @version      4.1
// @description  Improved date-time auto-booking with safer dropdown control
// ==/UserScript==

(function () {
    'use strict';
    console.log("🚀 Script started: Full automation enabled");

    let selectedDates = [];

    function humanLikeClick(element) {
        if (!element || !element.offsetParent) return;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        ['mousedown', 'mouseup', 'click'].forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                view: window
            }));
        });

        element.focus();
    }

    function getVisibleElement(selector) {
        return Array.from(document.querySelectorAll(selector)).find(el =>
            el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'
        );
    }

    function openAppointmentCalendar() {
        const calendarIcon = getVisibleElement('span.k-icon.k-i-calendar');
        if (calendarIcon) {
            const calendarBtn = calendarIcon.closest('span[role="button"]');
            humanLikeClick(calendarBtn);
            console.log("📅 Calendar opened");
            selectRandomDate();
        } else {
            requestAnimationFrame(openAppointmentCalendar);
        }
    }

    function selectRandomDate() {
        const dateLinks = Array.from(document.querySelectorAll('a.k-link[data-value]')).filter(link =>
            !link.closest('td').classList.contains('k-state-disabled') &&
            link.offsetParent !== null &&
            !selectedDates.includes(link.dataset.value)
        );

        if (dateLinks.length > 0) {
            const selected = dateLinks[Math.floor(Math.random() * dateLinks.length)];
            selectedDates.push(selected.dataset.value);
            humanLikeClick(selected);
            selected.dispatchEvent(new Event('input', { bubbles: true }));
            selected.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("📅 Selected date:", selected.dataset.value);

            // Ensure loader disappears after date selection
            waitForGlobalOverlayToDisappear(() => {
                console.log("✅ Date selection complete and loader gone");
                // Delay slightly before opening time dropdown
                setTimeout(openTimeDropdown, 30);
            });
        } else {
            moveToNextMonth();
        }
    }

    function moveToNextMonth() {
        const nextBtn = getVisibleElement('.k-nav-next');
        if (nextBtn) {
            humanLikeClick(nextBtn);
            setTimeout(selectRandomDate, 30);
        } else {
            requestAnimationFrame(moveToNextMonth);
        }
    }

    function waitForGlobalOverlayToDisappear(callback, attempt = 0) {
        const loader = document.querySelector('.global-overlay-loader');
        const isVisible = loader && loader.offsetParent !== null;

        if (!isVisible) {
            callback();
        } else if (attempt < 50) {
            requestAnimationFrame(() => waitForGlobalOverlayToDisappear(callback, attempt + 1));
        } else {
            console.warn("⚠️ Loader timeout. Proceeding anyway...");
            callback();
        }
    }

    function openTimeDropdown(attempt = 0) {
        const dropdowns = Array.from(document.querySelectorAll('span.k-dropdown-wrap'));
        const timeDropdown = dropdowns.find(dropdown => {
            const input = dropdown.querySelector('.k-input');
            return input && input.textContent.includes('--Select--') && dropdown.offsetParent !== null;
        });

        if (timeDropdown) {
            const icon = timeDropdown.querySelector('.k-select');
            if (icon) {
                humanLikeClick(icon);
                console.log("🕓 Time dropdown opened");
                setTimeout(() => selectRandomTimeSlot(), 20);
            }
        } else if (attempt < 10) {
            console.log("⏳ Waiting to retry opening time dropdown...");
            setTimeout(() => openTimeDropdown(attempt + 1), 30);
        } else {
            console.warn("❌ Could not open time dropdown after retries.");
        }
    }

    function selectRandomTimeSlot(attempt = 0) {
        const slots = Array.from(document.querySelectorAll('.slot-item.bg-success')).filter(
            el => el.offsetParent !== null
        );

        if (slots.length > 0) {
            const slot = slots[Math.floor(Math.random() * slots.length)];
            humanLikeClick(slot);
            slot.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("⏱ Time selected:", slot.textContent.trim());

            setTimeout(submitForm, 10);
        } else if (attempt < 10) {
            console.log("🔁 No slots found, re-checking...");
            setTimeout(() => {
                // Reopen dropdown before retrying
                openTimeDropdown();
            }, 30);
        } else {
            console.warn("❌ No available time slots after several attempts.");
        }
    }

    function submitForm() {
        const submitBtn = document.getElementById('btnSubmit');
        if (submitBtn && submitBtn.offsetParent !== null) {
            humanLikeClick(submitBtn);
            console.log("✅ Submit button clicked");
        } else {
            console.warn("❌ Submit button not found. Retrying...");
            setTimeout(submitForm, 50);
        }
    }

    window.addEventListener('load', () => {
        openAppointmentCalendar();
    });

})();
