
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));


    /* ---------- 1. TOAST NOTIFICATIONS ---------- */

    const toastStack = $('#toast-stack');

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.classList.add('toast', 'toast-' + type);

        const text = document.createElement('span');
        text.textContent = message;

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'toast-close';
        close.setAttribute('aria-label', 'Dismiss notification');
        close.innerHTML = '&times;';

        toast.append(text, close);
        toastStack.appendChild(toast);

        while (toastStack.children.length > 3) {
            toastStack.firstElementChild.remove();
        }

        const dismiss = () => {
            toast.classList.add('is-leaving');           /* plays the slide-out animation */
            setTimeout(() => toast.remove(), 300);
        };

        close.addEventListener('click', dismiss);
        setTimeout(dismiss, 4000);
    }


    /* ---------- 2. NAVIGATION: animated menu + current section ---------- */

    const toggle = $('.nav-toggle');
    const menu = $('#nav-menu');
    const label = $('.nav-toggle-label');
    const desktop = window.matchMedia('(min-width: 960px)');

    function setMenu(open) {
        if (open) { menu.classList.add('is-open'); }
        else { menu.classList.remove('is-open'); }
        toggle.setAttribute('aria-expanded', String(open));
        label.textContent = open ? 'Close' : 'Menu';
    }

    toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (e) => {
        if (e.target.closest('a')) { setMenu(false); }
    });

    desktop.addEventListener('change', () => setMenu(false));

    if ('IntersectionObserver' in window) {
        const links = $$('a', menu);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) { return; }
                links.forEach((link) => {
                    const active = link.getAttribute('href') === '#' + entry.target.id;
                    if (active) { link.setAttribute('aria-current', 'true'); }
                    else { link.removeAttribute('aria-current'); }
                });
            });
        }, { rootMargin: '-40% 0px -55% 0px' });

        $$('main section[id]').forEach((section) => observer.observe(section));
    }


    /* ---------- 3. BACK-TO-TOP: fades in after scrolling ---------- */

    const topButton = $('.fab-top');

    function updateTopButton() {
        topButton.classList.toggle('is-visible', window.scrollY > 400);
    }

    window.addEventListener('scroll', updateTopButton, { passive: true });
    updateTopButton();


    /* ---------- 4. BUTTON RIPPLE ---------- */

    document.addEventListener('click', (e) => {
        const target = e.target.closest('.btn, .btn-run, .card-toggle');
        if (!target) { return; }

        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');

        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

        target.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });


    /* ---------- 5. SERVICE CARDS: open / close detail panels ---------- */

    const cards = $$('.service-card');

    function setCard(card, open) {
        const button = $('.card-toggle', card);
        card.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
        $('.card-toggle-text', card).textContent = open ? 'Hide details' : 'More details';
    }

    cards.forEach((card) => {
        $('.card-toggle', card).addEventListener('click', () => {
            const willOpen = !card.classList.contains('is-open');
            cards.forEach((other) => setCard(other, false));   /* one open card at a time */
            setCard(card, willOpen);
        });
    });


    /* ---------- 6. PIPELINE SIMULATOR ---------- */

    const runButton = $('#run-pipeline');
    const progressBar = $('#progress-bar');
    const runStatus = $('#run-status');
    const stages = $$('.steps li');
    const stageText = [
        'Planning the release',
        'Writing the code',
        'Building the package',
        'Running automated tests',
        'Deploying to the cloud',
        'Monitoring the live system'
    ];
    let running = false;

    function runStage(i) {
        if (i >= stages.length) {
            running = false;
            runButton.disabled = false;
            runButton.classList.remove('is-running');
            runButton.textContent = 'Run again';
            runStatus.textContent = 'Pipeline finished. The release is live and monitored.';
            showToast('Pipeline finished. Release is live.', 'success');
            return;
        }

        stages[i].classList.add('is-active');
        runStatus.textContent = stageText[i] + '...';
        progressBar.style.width = ((i + 0.5) / stages.length * 100) + '%';

        setTimeout(() => {
            stages[i].classList.remove('is-active');
            stages[i].classList.add('is-done');
            progressBar.style.width = ((i + 1) / stages.length * 100) + '%';
            runStage(i + 1);
        }, 900);
    }

    runButton.addEventListener('click', () => {
        if (running) { return; }
        running = true;

        stages.forEach((stage) => stage.classList.remove('is-active', 'is-done'));
        progressBar.style.width = '0%';
        runButton.disabled = true;
        runButton.classList.add('is-running');
        runButton.textContent = 'Running...';

        showToast('Pipeline started.', 'info');
        runStage(0);
    });


    /* ---------- 7. GALLERY LIGHTBOX ---------- */

    const lightbox = $('#lightbox');
    const lightboxImg = $('#lightbox-img');
    const lightboxCaption = $('#lightbox-caption');
    const lightboxClose = $('.lightbox-close');
    let lastFocused = null;

    function openLightbox(item) {
        const image = $('img', item);
        lightboxImg.src = image.currentSrc || image.src;
        lightboxImg.alt = image.alt;
        lightboxCaption.textContent = $('h3', item).textContent + ': ' + $('p', item).textContent;

        lastFocused = item;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        setTimeout(() => lightboxClose.focus(), 50);
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        if (lastFocused) { lastFocused.focus(); }
    }

    $$('.gallery-item').forEach((item) => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', 'Enlarge: ' + $('h3', item).textContent);

        item.addEventListener('click', () => openLightbox(item));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(item);
            }
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) { closeLightbox(); }      /* click on the dark backdrop */
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') { return; }
        if (lightbox.classList.contains('is-open')) { closeLightbox(); }
        else if (menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });


    /* ---------- 8. FORM: validation shake, loading state, success toast ---------- */

    const form = $('#request-form');
    const submitButton = $('input[type="submit"]', form);
    let resettingByScript = false;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.classList.add('was-validated', 'shake');
            setTimeout(() => form.classList.remove('shake'), 500);
            showToast('Please complete the highlighted fields.', 'error');
            const firstInvalid = $(':invalid', form);
            if (firstInvalid) { firstInvalid.focus(); }
            return;
        }

        submitButton.value = 'Sending...';
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');

        setTimeout(() => {
            resettingByScript = true;
            form.reset();
            resettingByScript = false;

            form.classList.remove('was-validated');
            submitButton.value = 'Submit';
            submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
            showToast('Request sent. We will reply within one business day.', 'success');
        }, 1500);
    });

    form.addEventListener('reset', () => {
        form.classList.remove('was-validated');
        if (!resettingByScript) { showToast('Form cleared.', 'info'); }
    });
});