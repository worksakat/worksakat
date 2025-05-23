// ==UserScript==
// @name         Image spain,
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Fast automation for Spain Visa appointment site
// @match        https://appointment.thespainvisa.com/Global/*
// @match        https://appointment.thespainvisa.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ✅ Set this to the desired selfie image URL
    const clientImage = 'https://i.postimg.cc/XvcXTvMm/jmn.png';

    // 🔁 Fast element detection with mutation observer
    function fastWaitForElement(selector, callback) {
        const el = document.querySelector(selector);
        if (el) {
            callback(el);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                callback(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ⚡ Fast click function with configurable delay
    function fastClick(element, delay = 0) {
        if (!element) return false;

        setTimeout(() => {
            element.style.display = 'block';
            element.scrollIntoView({behavior: 'auto', block: 'center'});
            element.click();
        }, delay);

        return true;
    }

    // ✅ Step 1: Click the checkbox (if present) - Immediate
    const checkbox = document.evaluate('/html/body/div[6]/div/input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (checkbox && fastClick(checkbox)) {
        console.log('✅ Checkbox clicked');
    }

    // ✅ Step 2: Consent button with proper delay
    function handleConsentButton() {
        const consentButton = document.querySelector('button.btn.btn-primary[data-bs-dismiss="modal"][onclick="return onTermsAgree();"]');

        if (consentButton && !consentButton.disabled) {
            if (fastClick(consentButton, 300)) { // 300ms delay for reliability
                console.log('✅ Consent button clicked');
                return;
            }
        }
        setTimeout(handleConsentButton, 100);
    }
    // Start with a slightly longer delay for initial modal animation
    setTimeout(handleConsentButton, 500);

    // ✅ Step 3/4/4.1: Fast navigation handling
    function handleNavigation() {
        // Password change page
        if (/changepassword|home\/index/i.test(window.location.href)) {
            const link = document.querySelector('a.nav-link.new-app-active[href="/Global/appointment/newappointment"]');
            if (fastClick(link)) console.log('✅ Redirected to new appointment');
        }
        // Pending appointment page
        else if (/PendingAppointment/i.test(window.location.href)) {
            const targetBtn = [...document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]')]
                .find(btn => btn.textContent.trim() === "Book New Appointment");
            if (fastClick(targetBtn)) console.log('✅ Book New Appointment button clicked');
        }
        // Try Again button
        const tryAgainBtn = [...document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]')]
            .find(btn => btn.textContent.trim() === "Try Again");
        if (fastClick(tryAgainBtn)) console.log('✅ "Try Again" button clicked');
    }
    handleNavigation();

    // ✅ Step 5: Ultra-fast image upload
    function fastUploadImage() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", clientImage, true);
        xhr.responseType = "blob";
        xhr.timeout = 5000; // 5 second timeout

        xhr.onload = function() {
            if (xhr.status === 200) {
                const fd = new FormData();
                fd.append('file', xhr.response, "image.jpg");

                // Use fastest available method
                if (typeof fetch !== 'undefined') {
                    fetch("/Global/query/UploadProfileImage", {method: 'POST', body: fd})
                        .then(r => r.json())
                        .then(result => {
                            if (result.success) {
                                const preview = document.getElementById("uploadfile-1-preview");
                                const photoId = document.getElementById("ApplicantPhotoId");
                                if (preview) preview.src = "/Global/query/getfile?fileid=" + result.fileId;
                                if (photoId) photoId.value = result.fileId;
                                console.log('⚡ Selfie uploaded (fetch)');
                            }
                        });
                } else if (typeof $ !== 'undefined') {
                    $.ajax({
                        url: "/Global/query/UploadProfileImage",
                        type: 'post',
                        data: fd,
                        contentType: false,
                        processData: false,
                        success: function(result) {
                            if (result.success) {
                                $("#uploadfile-1-preview").attr("src", "/Global/query/getfile?fileid=" + result.fileId);
                                $("#ApplicantPhotoId").val(result.fileId);
                                console.log('⚡ Selfie uploaded (jQuery)');
                            }
                        }
                    });
                }
            }
        };
        xhr.send();
    }

    // Fast image upload trigger
    fastWaitForElement("#uploadfile-1-preview", fastUploadImage);

    // ✅ Login button with cooldown (optimized)
    function handleLoginButton() {
        const now = Date.now();
        const lastClick = localStorage.getItem('lastLoginClickTime');
        if (lastClick && (now - lastClick < 30000)) return;

        const loginBtn = document.querySelector('span.text-secondary.bg-light.rounded-3.p-2.fw-bold.login-link');
        if (fastClick(loginBtn, 100)) {
            localStorage.setItem('lastLoginClickTime', now.toString());
            console.log('✅ Login button clicked');
        } else {
            setTimeout(handleLoginButton, 100);
        }
    }
    handleLoginButton();
})();