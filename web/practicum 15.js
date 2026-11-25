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
            toast.classList.add('is-leaving');
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
            cards.forEach((other) => setCard(other, false));
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


    /* ---------- 7. GALLERY SEARCH, CATEGORY FILTER & LIGHTBOX ---------- */

    const galleryItems = $$('.gallery-item');
    const filterButtons = $$('.filter-btn');
    const gallerySearch = $('#gallery-search');
    const galleryCount = $('#gallery-count');
    const galleryEmpty = $('#gallery-empty');
    let activeCategory = 'all';

    function filterGallery() {
        const query = gallerySearch.value.trim().toLowerCase();

        const matchedItems = galleryItems.filter((item) => {
            const categoryMatch = activeCategory === 'all' || item.dataset.category === activeCategory;
            const titleText = $('h3', item).textContent.toLowerCase();
            const descText = $('p', item).textContent.toLowerCase();
            const tagText = $('.gallery-tag', item).textContent.toLowerCase();
            const searchMatch = !query || titleText.includes(query) || descText.includes(query) || tagText.includes(query);
            return categoryMatch && searchMatch;
        });

        galleryItems.forEach((item) => {
            const isVisible = matchedItems.includes(item);
            item.classList.toggle('is-hidden', !isVisible);
        });

        galleryCount.textContent = 'Showing ' + matchedItems.length + ' of ' + galleryItems.length + ' diagrams';
        galleryEmpty.hidden = matchedItems.length > 0;
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            filterButtons.forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            activeCategory = btn.dataset.filter;
            filterGallery();
        });
    });

    gallerySearch.addEventListener('input', filterGallery);

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

    galleryItems.forEach((item) => {
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
        if (e.target === lightbox) { closeLightbox(); }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') { return; }
        if (lightbox.classList.contains('is-open')) { closeLightbox(); }
        else if (menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });


    /* ---------- 8. SERVICE REQUEST FORM: constraints, error messages, success ---------- */

    const form = $('#request-form');
    const formSummary = $('#form-summary');
    const successBox = $('#form-success');
    const successText = $('#success-text');
    const submitButton = $('button[type="submit"]', form);
    const detailsBox = $('#details');
    const detailsCount = $('#details-count');
    const fields = $$('input, select, textarea', form);
    let resettingByScript = false;

    const FREE_MAIL = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];

    const FLAGS = ['valueMissing', 'badInput', 'typeMismatch', 'patternMismatch',
                   'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch'];

    const messages = {
        name:    { valueMissing: 'Please enter your full name.',
                   tooShort: 'Name must be at least 3 characters.',
                   patternMismatch: 'Use letters, spaces, dots, apostrophes or hyphens only.' },
        email:   { valueMissing: 'Please enter your work email.',
                   typeMismatch: 'Enter a valid email, e.g. name@company.com.',
                   patternMismatch: 'Enter a valid email, e.g. name@company.com.' },
        phone:   { valueMissing: 'Please enter your mobile number.',
                   patternMismatch: 'Enter 10 digits starting with 6, 7, 8 or 9.' },
        company: { valueMissing: 'Please enter your company name.',
                   tooShort: 'Company name must be at least 2 characters.' },
        cloud:   { valueMissing: 'Please choose a cloud provider.' },
        plan:    { valueMissing: 'Please choose a support plan.' },
        team:    { valueMissing: 'Please enter your team size.',
                   badInput: 'Enter numbers only.',
                   rangeUnderflow: 'Team size must be at least 1.',
                   rangeOverflow: 'Team size cannot be more than 500.',
                   stepMismatch: 'Enter a whole number.' },
        date:    { valueMissing: 'Please choose a start date.',
                   badInput: 'Enter a valid date.',
                   rangeUnderflow: 'Start date cannot be in the past.',
                   rangeOverflow: 'Choose a date within the next 12 months.' },
        repo:    { typeMismatch: 'Enter a full link starting with https://',
                   patternMismatch: 'Use a GitHub, GitLab or Bitbucket repository link.' },
        service: { valueMissing: 'Please choose a service type.' },
        technology: { valueMissing: 'Select at least one technology.' },
        details: { valueMissing: 'Please describe your project.',
                   tooShort: 'Please write at least 20 characters.',
                   tooLong: 'Keep the description under 500 characters.' },
        terms:   { valueMissing: 'You must agree before submitting.' }
    };

    function toISO(date) {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }

    (function setDateLimits() {
        const dateField = $('#date');
        const last = new Date();
        last.setFullYear(last.getFullYear() + 1);
        dateField.min = toISO(new Date());
        dateField.max = toISO(last);
    })();

    const keyOf = (field) => (field.type === 'radio' || field.name === 'technology') ? field.name : field.id;
    const boxOf = (field) => field.closest('.field');
    const errorOf = (field) => document.getElementById(field.dataset.error || field.id + '-error');

    function groupOf(field) {
        if (field.type === 'radio' || field.name === 'technology') {
            return $$('input[name="' + field.name + '"]', form);
        }
        return [field];
    }

    function getMessage(field) {
        const group = groupOf(field);
        group.forEach((f) => f.setCustomValidity(''));

        const key = keyOf(field);
        const validity = field.validity;

        if (key === 'email' && validity.valid) {
            const domain = field.value.split('@')[1].toLowerCase();
            if (FREE_MAIL.includes(domain)) { return 'Please use your work email, not a personal one.'; }
        }
        if (key === 'technology' && !group.some((f) => f.checked)) {
            return messages.technology.valueMissing;
        }

        if (validity.valid) { return ''; }

        const set = messages[key] || {};
        for (const flag of FLAGS) {
            if (validity[flag]) { return set[flag] || field.validationMessage; }
        }
        return field.validationMessage;
    }

    function validateField(field) {
        const message = getMessage(field);
        const group = groupOf(field);
        const box = boxOf(field);

        group.forEach((f) => {
            f.setCustomValidity(message);
            if (message) { f.setAttribute('aria-invalid', 'true'); }
            else { f.removeAttribute('aria-invalid'); }
        });

        errorOf(field).textContent = message;
        box.classList.toggle('has-error', Boolean(message));
        box.classList.toggle('is-valid', !message && box.classList.contains('is-touched'));
        return !message;
    }

    fields.forEach((field) => {
        const box = boxOf(field);
        const onChangeEvent = field.type === 'checkbox' || field.type === 'radio' || field.tagName === 'SELECT';
        const liveEvent = onChangeEvent ? 'change' : 'input';

        field.addEventListener('blur', () => {
            box.classList.add('is-touched');
            validateField(field);
        });

        field.addEventListener(liveEvent, () => {
            if (onChangeEvent) { box.classList.add('is-touched'); }
            if (box.classList.contains('is-touched')) { validateField(field); }
            if (formSummary.hidden === false && form.checkValidity()) { formSummary.hidden = true; }
        });
    });

    function updateCount() {
        detailsCount.textContent = detailsBox.value.length + ' / ' + detailsBox.maxLength;
    }
    detailsBox.addEventListener('input', updateCount);

    function clearState() {
        fields.forEach((field) => {
            field.setCustomValidity('');
            field.removeAttribute('aria-invalid');
            boxOf(field).classList.remove('is-touched', 'has-error', 'is-valid');
            errorOf(field).textContent = '';
        });
        formSummary.hidden = true;
        updateCount();
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        successBox.hidden = true;

        let firstInvalid = null;
        const badMessages = new Set();

        fields.forEach((field) => {
            boxOf(field).classList.add('is-touched');
            if (!validateField(field)) {
                badMessages.add(errorOf(field).id);
                if (!firstInvalid) { firstInvalid = field; }
            }
        });

        if (!form.checkValidity()) {
            const count = badMessages.size;
            formSummary.textContent = 'Please fix ' + count + (count === 1 ? ' field' : ' fields') + ' before submitting.';
            formSummary.hidden = false;

            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
            showToast('Please correct the highlighted fields.', 'error');

            firstInvalid.focus();
            firstInvalid.reportValidity();
            return;
        }

        const person = $('#name').value.trim().split(' ')[0];
        const service = (form.elements['service'].value || 'your');
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');

        setTimeout(() => {
            const reference = 'REQ-' + String(Math.floor(1000 + Math.random() * 9000));

            resettingByScript = true;
            form.reset();
            resettingByScript = false;
            clearState();

            submitButton.textContent = 'Submit';
            submitButton.disabled = false;
            submitButton.classList.remove('is-loading');

            successText.textContent = 'Thank you, ' + person + '. Your ' + service +
                ' request is registered with reference ' + reference +
                '. We will reply within one business day.';
            successBox.hidden = false;
            successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('Request ' + reference + ' submitted.', 'success');
        }, 1200);
    });

    form.addEventListener('reset', () => {
        successBox.hidden = true;
        setTimeout(clearState, 0);
        if (!resettingByScript) { showToast('Form cleared.', 'info'); }
    });

    updateCount();


    /* ---------- 9. CUSTOM TOGGLE SWITCH: Maintenance / Deployment Freeze Mode ---------- */

    const freezeToggle = document.getElementById('freeze-toggle');
    const freezeCard = document.getElementById('freeze-card');
    const freezeDesc = document.getElementById('freeze-desc');
    const freezeState = document.getElementById('freeze-state');
    const taskAddBtn = document.getElementById('task-add-btn');
    const statusPill = document.getElementById('system-status-pill');
    const statusPillText = document.getElementById('system-status-text');
    const FREEZE_KEY = 'devops-freeze-v1';

    function applyFreezeState(isFrozen) {
        freezeCard.classList.toggle('is-active', isFrozen);
        statusPill.classList.toggle('is-maintenance', isFrozen);
        document.getElementById('task-form').classList.toggle('is-frozen', isFrozen);

        freezeState.textContent = isFrozen ? 'ON' : 'OFF';
        taskAddBtn.disabled = isFrozen;
        taskAddBtn.textContent = isFrozen ? 'Deployments Frozen' : 'Add deployment';

        freezeDesc.innerHTML = isFrozen
            ? 'Maintenance window <strong>active</strong>. New deployments are locked until freeze is lifted.'
            : 'Deployments are currently <strong>unlocked</strong>. New releases can be scheduled normally.';

        statusPillText.textContent = isFrozen
            ? 'Maintenance mode: Deployments frozen'
            : 'All systems operational';
    }

    /* Restore saved switch setting from Local Storage */
    try {
        const savedFreeze = localStorage.getItem(FREEZE_KEY) === 'true';
        freezeToggle.checked = savedFreeze;
        applyFreezeState(savedFreeze);
    } catch (err) {
        applyFreezeState(false);
    }

    freezeToggle.addEventListener('change', () => {
        const isFrozen = freezeToggle.checked;
        applyFreezeState(isFrozen);
        try { localStorage.setItem(FREEZE_KEY, String(isFrozen)); } catch (err) {}
        showToast(
            isFrozen ? 'Production Deployment Freeze enabled.' : 'Production Deployment Freeze lifted.',
            isFrozen ? 'error' : 'success'
        );
    });


    /* ---------- 10. DEPLOYMENT TRACKER: add, edit, display and remove records ---------- */

    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const taskEmpty = document.getElementById('task-empty');
    const taskError = document.getElementById('task-error');
    const taskSearch = document.getElementById('task-search');
    const taskClear = document.getElementById('task-clear');

    const STATUSES = ['Planned', 'Deploying', 'Live', 'Failed'];
    const ENVIRONMENTS = ['Development', 'Staging', 'Production'];
    const STORAGE_KEY = 'devops-tracker-v1';
    const starterData = [
        { id: 1, service: 'Auth Service', version: 'v2.3.0', env: 'Production', status: 'Live' },
        { id: 2, service: 'Payment API', version: 'v1.8.2', env: 'Staging', status: 'Deploying' },
        { id: 3, service: 'Web Dashboard', version: 'v3.0.0', env: 'Development', status: 'Planned' }
    ];

    /* READ from Local Storage */
    function loadTasks() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved)) { return saved; }
        } catch (err) { /* storage blocked or unreadable: use the starter data */ }
        return starterData.slice();
    }

    /* WRITE to Local Storage */
    function saveTasks() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
        catch (err) { /* storage unavailable: the page still works for this visit */ }
    }

    let tasks = loadTasks();
    let editingId = null;

    function findTask(item) {
        return tasks.find((task) => String(task.id) === item.getAttribute('data-id'));
    }

    function makeButton(className, text, label) {
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.className = 'task-btn ' + className;
        button.textContent = text;
        button.setAttribute('aria-label', label);
        return button;
    }

    function makeInput(value, label, max) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.maxLength = max;
        input.setAttribute('aria-label', label);
        return input;
    }

    function makeSelect(options, current, label) {
        const select = document.createElement('select');
        select.setAttribute('aria-label', label);
        options.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            if (name === current) { option.selected = true; }
            select.appendChild(option);
        });
        return select;
    }

    function showTaskError(message) {
        taskError.textContent = message;
    }

    function checkRecord(service, version) {
        if (service.length < 2) { return 'Service name must be at least 2 characters.'; }
        if (version.length < 1) { return 'Please enter a version.'; }
        return '';
    }

    /* DISPLAY: build one list item (display mode or edit mode) */
    function buildItem(task) {
        const item = document.createElement('li');
        item.className = 'task-item status-' + task.status.toLowerCase();
        item.setAttribute('data-id', task.id);

        if (task.id === editingId) {
            const row = document.createElement('div');
            row.className = 'task-edit-row';

            const nameInput = makeInput(task.service, 'Service name', 40);
            const versionInput = makeInput(task.version, 'Version', 15);
            const envSelect = makeSelect(ENVIRONMENTS, task.env, 'Environment');
            const save = makeButton('', 'Save', 'Save changes to ' + task.service);
            const cancel = makeButton('task-btn-delete', 'Cancel', 'Cancel editing');

            /* UPDATE: save the edited values */
            save.addEventListener('click', () => {
                const service = nameInput.value.trim();
                const version = versionInput.value.trim();
                const problem = checkRecord(service, version);
                if (problem) { showTaskError(problem); return; }

                const target = findTask(item);
                target.service = service;
                target.version = version;
                target.env = envSelect.value;
                editingId = null;
                saveTasks();
                showTaskError('');
                renderTasks();
                showToast('Deployment updated.', 'success');
            });

            cancel.addEventListener('click', () => {
                editingId = null;
                showTaskError('');
                renderTasks();
            });

            row.append(nameInput, versionInput, envSelect, save, cancel);
            item.appendChild(row);
            return item;
        }

        const info = document.createElement('div');
        info.className = 'task-info';

        const title = document.createElement('h3');
        title.textContent = task.service + ' ' + task.version;

        const meta = document.createElement('p');
        meta.className = 'task-meta';
        meta.textContent = task.env + ' environment';

        info.append(title, meta);

        const actions = document.createElement('div');
        actions.className = 'task-actions';

        /* UPDATE: change the status straight from the list */
        const statusSelect = makeSelect(STATUSES, task.status, 'Status of ' + task.service);
        statusSelect.addEventListener('change', () => {
            findTask(item).status = statusSelect.value;
            saveTasks();
            renderTasks();
            showToast(task.service + ' is now ' + statusSelect.value + '.', 'info');
        });

        const edit = makeButton('', 'Edit', 'Edit ' + task.service);
        edit.addEventListener('click', () => {
            editingId = task.id;
            showTaskError('');
            renderTasks();
        });

        /* DELETE: remove one record */
        const del = makeButton('task-btn-delete', 'Delete', 'Delete ' + task.service);
        del.addEventListener('click', () => {
            item.classList.add('is-removing');
            setTimeout(() => {
                tasks = tasks.filter((t) => t.id !== task.id);
                saveTasks();
                item.remove();
                renderTasks();
                showToast('Deployment deleted.', 'error');
            }, 300);
        });

        actions.append(statusSelect, edit, del);
        item.append(info, actions);
        return item;
    }

    /* READ: draw the whole list, filtered by the search box */
    function renderTasks() {
        while (taskList.firstChild) { taskList.firstChild.remove(); }

        const term = taskSearch.value.trim().toLowerCase();
        const visible = tasks.filter((t) =>
            (t.service + ' ' + t.version + ' ' + t.env + ' ' + t.status).toLowerCase().includes(term)
        );

        visible.forEach((task) => taskList.appendChild(buildItem(task)));

        taskEmpty.hidden = visible.length > 0;
        taskEmpty.textContent = tasks.length === 0
            ? 'No deployments yet. Add one above.'
            : 'No deployments match your search.';
        taskClear.hidden = tasks.length === 0;
    }

    /* CREATE: add a new record */
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (freezeToggle.checked) {
            showTaskError('Deployments are currently frozen due to Maintenance Mode.');
            return;
        }

        const service = document.getElementById('task-service').value.trim();
        const version = document.getElementById('task-version').value.trim();
        const env = document.getElementById('task-env').value;
        const status = document.getElementById('task-status').value;

        const problem = checkRecord(service, version);
        if (problem) { showTaskError(problem); return; }

        tasks.push({ id: Date.now(), service: service, version: version, env: env, status: status });
        saveTasks();
        showTaskError('');
        taskForm.reset();
        taskSearch.value = '';
        renderTasks();
        showToast('Deployment added.', 'success');
    });

    taskSearch.addEventListener('input', renderTasks);

    /* DELETE ALL */
    taskClear.addEventListener('click', () => {
        if (!confirm('Delete all deployment records?')) { return; }
        tasks = [];
        saveTasks();
        renderTasks();
        showToast('All records deleted.', 'error');
    });

    renderTasks();

});