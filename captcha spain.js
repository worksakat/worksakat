// ==UserScript==
// @name         Captcha Spain,
// @namespace    http://tampermonkey.net/
// @version      2025.05.19
// @description  Fast CAPTCHA solver and auto-submitter
// @author       you
// @match        https://appointment.thespainvisa.com/*
// @grant        unsafeWindow
// ==/UserScript==

'use strict';

const captchaConfig = {
  enabled: 'on',
  apiKey: 'nospain1122-2746a773-30af-b89c-55e2-9946af135428',
};

function solveCaptcha(autoSubmit = true) {
  if (location.hostname !== 'appointment.thespainvisa.com') return;
  if (!captchaConfig.apiKey || !/on|true/.test(captchaConfig.enabled)) return;

  const grid = getCaptchaGrid();
  const target = getCaptchaTarget();
  const images = grid.map(img => img.src);

  $.post({
    url: 'https://pro.nocaptchaai.com/solve',
    headers: { apiKey: captchaConfig.apiKey },
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify({ method: 'ocr', id: 'morocco', images: Object.fromEntries(images.entries()) }),
    timeout: 15000,

    beforeSend() {
      $('<div>', {
        class: 'lead',
        html: '<span class="spinner-grow"></span> Solving Captcha...',
        css: {
          backgroundColor: '#fff',
          color: '#000',
          fontWeight: 'bold',
          fontSize: 'medium',
          border: '2px solid rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '7px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: '9999'
        }
      }).prependTo('.main-div-container');
    },

    complete(xhr, state) {
      $('.lead:contains("Solving Captcha")').remove();
      if (state === 'success') return onSuccess(xhr.responseJSON, grid, target, autoSubmit);
      onError(state, xhr);
    }
  });
}

function onSuccess(result, grid, target, autoSubmit) {
  if (result.status !== 'solved') return onError('solve_failed', result);

  Object.entries(result.solution).forEach(([index, value]) => {
    if (value === target && grid[index]) {
      grid[index].click();
      console.log(`✅ Clicked image at index ${index}`);
    }
  });

  if (autoSubmit) onSubmit();
}

function onError(type, data) {
  console.error('Captcha error:', type, data);
  $('.validation-summary-valid').html('<b>🙂 D FOR DUMBO</b>');
}

function getCaptchaTarget() {
  return $('.box-label').sort((a, b) =>
    getComputedStyle(b).zIndex - getComputedStyle(a).zIndex
  ).first().text().replace(/\D+/g, '');
}

function getCaptchaGrid() {
  const rows = $(':has(> .captcha-img):visible').get()
    .reduce((acc, el) => {
      const top = Math.floor(el.offsetTop);
      if (!acc[top]) acc[top] = [];
      acc[top].push(el);
      return acc;
    }, {});

  return Object.values(rows)
    .flatMap(group => {
      return group
        .sort((a, b) => getComputedStyle(b).zIndex - getComputedStyle(a).zIndex)
        .slice(0, 3)
        .sort((a, b) => a.offsetLeft - b.offsetLeft)
        .map(el => el.querySelector('.captcha-img'));
    });
}

function onSubmit() {
  const btn = document.getElementById('btnVerify');
  if (btn) {
    console.log('🔘 Submitting...');
    btn.click();
  } else if (typeof OnCaptchaSubmit === 'function') {
    OnCaptchaSubmit();
  } else {
    console.warn('⚠️ Submit method not found.');
  }
}

$(document).ready(() => {
  console.log("🚀 Fast Captcha Solver Activated");
  solveCaptcha(true);
});
