// ==UserScript==
// @name         Image spain,
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Automates checkbox clicks, consent acceptance, appointment booking, and selfie upload on the Spain Visa appointment site.
// @match        https://appointment.thespainvisa.com/Global/*
// @match        https://appointment.thespainvisa.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ✅ Set this to the desired selfie image URL
    const clientImage = 'https://i.postimg.cc/L8cDG8sv/Appointment-Letter-15.png';    // put client image url here...............

    // 🔁 Utility: Wait for an element to appear
    function waitForElement(selector, callback) {
        const el = document.querySelector(selector);
        if (el) {
            callback(el);
        } else {
            setTimeout(() => waitForElement(selector, callback), 500);
        }
    }

    // ✅ Step 1: Click the checkbox (if present)
    const checkbox = document.evaluate('/html/body/div[6]/div/input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (checkbox) {
        checkbox.click();
        console.log('✅ Checkbox clicked');
    }

    // ✅ Step 2: Click "I agree to provide my consent" button (polling)
    function waitAndClickConsentButton(maxAttempts = 20, interval = 500) {
        let attempts = 0;

        const intervalId = setInterval(() => {
            const consentButton = document.querySelector('button.btn.btn-primary[data-bs-dismiss="modal"][onclick="return onTermsAgree();"]');

            if (consentButton && !consentButton.disabled && consentButton.offsetParent !== null) {
                consentButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    consentButton.click();
                    console.log('✅ Consent button clicked');
                }, 300);
                clearInterval(intervalId);
            }

            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(intervalId);
                console.warn('⚠️ Consent button not found or not clickable.');
            }
        }, interval);
    }

    waitAndClickConsentButton();

    // ✅ Step 3: Auto-click "Book New Appointment" from password change page
    const passwordChangeUrls = [
        'https://appointment.thespainvisa.com/Global/account/changepassword?alert=True',
        'https://appointment.thespainvisa.com/Global/account/changepassword',
        'https://appointment.thespainvisa.com/Global/home/index'
    ];

    if (passwordChangeUrls.includes(window.location.href)) {
        const appointmentLink = document.querySelector('a.nav-link.new-app-active[href="/Global/appointment/newappointment"]');
        if (appointmentLink) {
            appointmentLink.click();
            console.log('✅ Redirected to new appointment from change password page');
        }
    }

    // ✅ Step 4: Auto-click "Book New Appointment" button on PendingAppointment page
    if (window.location.href === 'https://appointment.thespainvisa.com/Global/Appointment/PendingAppointment') {
        const targetButton = Array.from(document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]'))
            .find(btn => btn.textContent.trim() === "Book New Appointment");

        if (targetButton) {
            targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                targetButton.click();
                console.log('✅ Book New Appointment button clicked');
            }, 200);
        }
    }

    // ✅ Step 4.1: Auto-click "Try Again" button (if present)
    function clickTryAgainButton() {
        const tryAgainBtn = Array.from(document.querySelectorAll('a.btn.btn-primary[href="/Global/appointment/newappointment"]'))
            .find(btn => btn.textContent.trim() === "Try Again");

        if (tryAgainBtn) {
            tryAgainBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                tryAgainBtn.click();
                console.log('✅ "Try Again" button clicked');
            }, 200);
        }
    }

    // Run it on all matched pages
    clickTryAgainButton();

    // ✅ Step 5: Auto-upload selfie to profile image
    function uploadImage() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", clientImage, true);
        xhr.responseType = "blob";

        xhr.onload = function () {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const fd = new FormData();
                fd.append('file', blob, "image.jpg");

                // Use native fetch if jQuery is not available
                if (typeof $ === 'undefined') {
                    fetch("/Global/query/UploadProfileImage", {
                        method: 'POST',
                        body: fd
                    })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                document.getElementById("uploadfile-1-preview").src = "/Global/query/getfile?fileid=" + result.fileId;
                                document.getElementById("ApplicantPhotoId").value = result.fileId;
                                console.log('✅ Selfie uploaded successfully (native)');
                            } else {
                                alert(result.err || "Upload failed.");
                            }
                        })
                        .catch(() => alert("Image upload failed."));
                } else {
                    $.ajax({
                        url: "/Global/query/UploadProfileImage",
                        type: 'post',
                        data: fd,
                        contentType: false,
                        processData: false,
                        success: function (result) {
                            if (result.success) {
                                $("#uploadfile-1-preview").attr("src", "/Global/query/getfile?fileid=" + result.fileId);
                                $("#ApplicantPhotoId").val(result.fileId);
                                console.log('✅ Selfie uploaded successfully (jQuery)');
                            } else {
                                alert(result.err || "Upload failed.");
                            }
                        }
                    });
                }
            } else {
                alert("Failed to retrieve the image from the URL.");
            }
        };

        xhr.onerror = function () {
            alert("Network error occurred while downloading the image.");
        };

        xhr.send();
    }

    // Wait for the profile preview image element before uploading
    waitForElement("#uploadfile-1-preview", () => {
        uploadImage();
    });

})();
