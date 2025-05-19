// ==UserScript==
// @name        Spain auto locations,
// @namespace   Violentmonkey Scripts
// @match       https://appointment.thespainvisa.com/Global/Appointment/VisaType*
// @grant       none
// @version     1.1
// @author      -
// @description Automatically fills and submits the Spain visa appointment form
// ==/UserScript==

(function() {
    'use strict';

    // ===== CONFIGURATION ===== //
    // Set the desired option indexes for each dropdown (0-based)
    const CONFIG = {
        categoryIndex: 0,      // 0 FOR NORMAL
        formLocationIndex: 0, // O FOR ISLAMABAD, 1 FOR KARACHI, 2 FOR LAHORE,
        visaTypeIndex: 1,      // 0 FOR EU, 1 FOR NATIONAL, 2 FOR SCHENGEN,
        visaSubTypeIndex: 1,  // 0 FOR FAMILY REUNION, 1 FOR OTHER NATIONAL, 2 FOR STUDY, 3 FOR WORK,  7 FOR TOURIST, 2 for buisness(schengen)
        missionIndex: 0       // Mission dropdown selection
    };
    // ===== END CONFIGURATION ===== //

    /**
     * Waits for an element to appear in the DOM
     * @param {string} selector - CSS selector of the element to wait for
     * @param {number} timeout - Maximum time to wait in milliseconds (default: 10s)
     * @returns {Promise<Element>} The matched element
     */
    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const intervalTime = 100;
            let timeSpent = 0;

            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }

                timeSpent += intervalTime;
                if (timeSpent >= timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timeout waiting for selector: ${selector}`));
                }
            }, intervalTime);
        });
    };

    /**
     * Selects an option from a Kendo UI dropdown by index
     * @param {Element} dropdown - The dropdown element to click
     * @param {string} listboxSelector - Selector for the dropdown's listbox
     * @param {number} index - Index of the option to select (0-based)
     * @returns {Promise<void>}
     */
    const selectOptionByIndex = (dropdown, listboxSelector, index) => {
        return new Promise((resolve) => {
            if (!dropdown) return resolve();

            dropdown.click();

            const waitForOptions = () => {
                const options = document.querySelectorAll(`${listboxSelector} .k-item`);
                if (options.length > 0 && options[index]) {
                    options[index].click();
                    resolve();
                } else {
                    setTimeout(waitForOptions, 50);
                }
            };

            waitForOptions();
        });
    };

    /**
     * Main function to fill and submit the form
     */
    const fillAndSubmitForm = async () => {
        if (window.location.hostname !== 'appointment.thespainvisa.com') {
            console.warn('Script not running - incorrect domain');
            return;
        }

        try {
            await waitForElement('form .mb-3');

            // Find all visible form elements
            const formElements = Array.from(document.querySelectorAll('form .mb-3'))
                .filter(el => window.getComputedStyle(el).display !== 'none');

            // Map form fields to their elements
            const fields = {};
            formElements.forEach(element => {
                const label = element.querySelector('label');
                const select = element.querySelector('span.k-select');

                if (label && select) {
                    const labelText = label.textContent.trim();
                    const labelId = label.getAttribute('for');
                    if (!labelId) return;

                    if (labelText.includes('Category')) fields.category = { dropdown: select, listboxId: `${labelId}_listbox` };
                    else if (labelText.includes('Location')) fields.location = { dropdown: select, listboxId: `${labelId}_listbox` };
                    else if (labelText.includes('Visa Type')) fields.visaType = { dropdown: select, listboxId: `${labelId}_listbox` };
                    else if (labelText.includes('Visa Sub Type')) fields.visaSubType = { dropdown: select, listboxId: `${labelId}_listbox` };
                    else if (labelText.includes('Mission')) fields.mission = { dropdown: select, listboxId: `${labelId}_listbox` };
                }
            });

            // Fill out the form using the configuration
            if (fields.category) await selectOptionByIndex(fields.category.dropdown, `#${fields.category.listboxId}`, CONFIG.categoryIndex);
            if (fields.location) await selectOptionByIndex(fields.location.dropdown, `#${fields.location.listboxId}`, CONFIG.formLocationIndex);
            if (fields.visaType) await selectOptionByIndex(fields.visaType.dropdown, `#${fields.visaType.listboxId}`, CONFIG.visaTypeIndex);
            if (fields.visaSubType) await selectOptionByIndex(fields.visaSubType.dropdown, `#${fields.visaSubType.listboxId}`, CONFIG.visaSubTypeIndex);
            if (fields.mission) await selectOptionByIndex(fields.mission.dropdown, `#${fields.mission.listboxId}`, CONFIG.missionIndex);

            // Submit the form
            const submitButton = document.querySelector('#btnSubmit');
            if (submitButton) {
                submitButton.click();
                console.log('Form submitted successfully!');
            } else {
                console.warn('Submit button not found');
            }

        } catch (error) {
            console.error('Error in form filling:', error);
        }
    };

    // Start the process
    fillAndSubmitForm();
})();