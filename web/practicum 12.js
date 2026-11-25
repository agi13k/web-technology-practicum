
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

    /* The order in which the browser's validity flags are checked */
    const FLAGS = ['valueMissing', 'badInput', 'typeMismatch', 'patternMismatch',
                   'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch'];

    /* Friendly message for each field and each kind of mistake */
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

    /* Start date: from today up to 12 months ahead (min and max attributes set from script) */
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

    /* Radios and the technology checkboxes are validated as one group */
    function groupOf(field) {
        if (field.type === 'radio' || field.name === 'technology') {
            return $$('input[name="' + field.name + '"]', form);
        }
        return [field];
    }

    /* Work out the error text for one field ('' means the field is valid) */
    function getMessage(field) {
        const group = groupOf(field);
        group.forEach((f) => f.setCustomValidity(''));        /* clear the old custom message first */

        const key = keyOf(field);
        const validity = field.validity;

        /* Custom rules the HTML attributes cannot express */
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

    /* Show or clear the error for one field; returns true when it is valid */
    function validateField(field) {
        const message = getMessage(field);
        const group = groupOf(field);
        const box = boxOf(field);

        group.forEach((f) => {
            f.setCustomValidity(message);                      /* keeps :invalid and reportValidity in step */
            if (message) { f.setAttribute('aria-invalid', 'true'); }
            else { f.removeAttribute('aria-invalid'); }
        });

        errorOf(field).textContent = message;
        box.classList.toggle('has-error', Boolean(message));
        box.classList.toggle('is-valid', !message && box.classList.contains('is-touched'));
        return !message;
    }

    /* Live checking: on leaving a field, then on every change after that */
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

    /* Character counter for the details box */
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
        e.preventDefault();                                    /* stay on the page: we validate first */
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
            firstInvalid.reportValidity();                     /* browser bubble with the same message */
            return;
        }

        /* Valid: pretend to send, then show the success message */
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
        setTimeout(clearState, 0);                             /* runs after the browser has cleared the values */
        if (!resettingByScript) { showToast('Form cleared.', 'info'); }
    });

    updateCount();


    /* ---------- 9. DEPLOYMENT TRACKER: add, edit, display and remove records ---------- */

    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const taskEmpty = document.getElementById('task-empty');
    const taskError = document.getElementById('task-error');
    const taskSearch = document.getElementById('task-search');
    const taskClear = document.getElementById('task-clear');

    const STATUSES = ['Planned', 'Deploying', 'Live', 'Failed'];
    const STORAGE_KEY = 'devops-tracker-v1';
    const starterData = [
        { id: 1, service: 'Auth Service', version: 'v2.3.0', env: 'Production', status: 'Live' },
        { id: 2, service: 'Payment API', version: 'v1.8.2', env: 'Staging', status: 'Deploying' },
        { id: 3, service: 'Web Dashboard', version: 'v3.0.0', env: 'Development', status: 'Planned' }
    ];

    function loadTasks() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved)) { return saved; }
        } catch (err) { /* storage blocked or unreadable: use the starter data */ }
        return starterData.slice();
    }

    function saveTasks() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
        catch (err) { /* storage unavailable: the page still works for this visit */ }
    }

    let tasks = loadTasks();

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
        input.setAttribute('type', 'text');
        input.className = 'edit-input';
        input.value = value;
        input.setAttribute('maxlength', String(max));
        input.setAttribute('aria-label', label);
        return input;
    }

    /* DISPLAY: build one record from the data with createElement + appendChild */
    function createTaskItem(task) {
        const item = document.createElement('li');
        item.className = 'task-item';
        item.setAttribute('data-id', task.id);
        item.setAttribute('data-status', task.status.toLowerCase());

        const main = document.createElement('div');
        main.className = 'task-main';

        const name = document.createElement('span');
        name.className = 'task-name';
        name.textContent = task.service;

        const version = document.createElement('span');
        version.className = 'task-version';
        version.textContent = task.version;

        main.appendChild(name);
        main.appendChild(version);

        const meta = document.createElement('p');
        meta.className = 'task-meta';
        meta.textContent = task.env + ' environment';

        const actions = document.createElement('div');
        actions.className = 'task-actions';
        actions.appendChild(makeButton('task-status', task.status, 'Status: ' + task.status + '. Click to change.'));
        actions.appendChild(makeButton('task-edit', 'Edit', 'Edit ' + task.service));

        const remove = makeButton('task-remove', '', 'Remove ' + task.service);
        remove.innerHTML = '&times; Remove';
        actions.appendChild(remove);

        item.appendChild(main);
        item.appendChild(meta);
        item.appendChild(actions);
        return item;
    }

    /* Summary numbers, with a small "bump" when a number changes */
    function setStat(id, value) {
        const el = document.getElementById(id);
        if (el.textContent === String(value)) { return; }
        el.textContent = value;
        el.classList.add('is-bump');
        setTimeout(() => el.classList.remove('is-bump'), 250);
    }

    function updateStats() {
        setStat('stat-total', tasks.length);
        setStat('stat-live', tasks.filter((t) => t.status === 'Live').length);
        setStat('stat-failed', tasks.filter((t) => t.status === 'Failed').length);
    }

    /* Search filter + empty message */
    function syncView() {
        const query = taskSearch.value.trim().toLowerCase();

        $$('.task-item', taskList).forEach((item) => {
            const task = findTask(item);
            const text = task ? [task.service, task.version, task.env, task.status].join(' ').toLowerCase() : '';
            item.classList.toggle('is-hidden', !text.includes(query));
        });

        const visible = $$('.task-item:not(.is-hidden):not(.is-removing)', taskList).length;

        if (tasks.length === 0) {
            taskEmpty.innerHTML = '<strong>No deployments yet.</strong> Add your first one using the form.';
            taskEmpty.hidden = false;
        } else if (visible === 0) {
            taskEmpty.textContent = 'No deployments match "' + taskSearch.value.trim() + '".';
            taskEmpty.hidden = false;
        } else {
            taskEmpty.hidden = true;
        }
    }

    /* ADD */
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const service = document.getElementById('task-service');
        const version = document.getElementById('task-version');
        const env = document.getElementById('task-env');
        const name = service.value.trim();

        if (!name) {
            taskError.textContent = 'Please enter a service name.';
            service.setAttribute('aria-invalid', 'true');
            taskForm.classList.add('shake');
            setTimeout(() => taskForm.classList.remove('shake'), 500);
            service.focus();
            return;
        }

        const task = {
            id: Date.now(),
            service: name,
            version: version.value.trim() || 'v1.0.0',
            env: env.value,
            status: 'Planned'
        };

        tasks.push(task);
        taskList.appendChild(createTaskItem(task));

        taskForm.reset();
        taskError.textContent = '';
        service.removeAttribute('aria-invalid');
        service.focus();

        saveTasks();
        updateStats();
        syncView();
        showToast(name + ' added to the tracker.', 'success');
    });

    document.getElementById('task-service').addEventListener('input', (e) => {
        e.target.removeAttribute('aria-invalid');
        taskError.textContent = '';
    });

    taskSearch.addEventListener('input', syncView);

    /* MODIFY: inline edit of name and version */
    function openEdit(item, task, button) {
        const nameEl = $('.task-name', item);
        const versionEl = $('.task-version', item);

        item.classList.add('is-editing');
        nameEl.textContent = '';
        versionEl.textContent = '';
        nameEl.appendChild(makeInput(task.service, 'Service name', 40));
        versionEl.appendChild(makeInput(task.version, 'Version', 12));
        button.textContent = 'Save';
        nameEl.firstElementChild.focus();
    }

    function closeEdit(item, task, button) {
        $('.task-name', item).textContent = task.service;
        $('.task-version', item).textContent = task.version;
        item.classList.remove('is-editing');
        button.textContent = 'Edit';
        button.setAttribute('aria-label', 'Edit ' + task.service);
        $('.task-remove', item).setAttribute('aria-label', 'Remove ' + task.service);
    }

    function saveEdit(item, task, button) {
        const nameInput = $('.task-name', item).firstElementChild;
        const versionInput = $('.task-version', item).firstElementChild;
        const newName = nameInput.value.trim();

        if (!newName) {
            nameInput.setAttribute('aria-invalid', 'true');
            nameInput.focus();
            showToast('Service name cannot be empty.', 'error');
            return;
        }

        task.service = newName;
        task.version = versionInput.value.trim() || 'v1.0.0';
        closeEdit(item, task, button);
        saveTasks();
        syncView();
        showToast('Deployment updated.', 'success');
    }

    function changeStatus(item, task, button) {
        const next = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length];

        task.status = next;
        item.setAttribute('data-status', next.toLowerCase());
        button.textContent = next;
        button.setAttribute('aria-label', 'Status: ' + next + '. Click to change.');

        item.classList.add('is-updated');
        setTimeout(() => item.classList.remove('is-updated'), 500);

        saveTasks();
        updateStats();
        showToast(task.service + ' is now ' + next + '.', next === 'Failed' ? 'error' : 'info');
    }

    /* REMOVE */
    function removeTask(item, task) {
        if (item.classList.contains('is-removing')) { return; }
        item.classList.add('is-removing');                  /* plays the slide-out animation */

        setTimeout(() => {
            item.remove();
            tasks = tasks.filter((t) => t !== task);
            saveTasks();
            updateStats();
            syncView();
        }, 300);

        showToast(task.service + ' removed.', 'info');
    }

    /* One listener on the list handles every button, even for items added later */
    taskList.addEventListener('click', (e) => {
        const button = e.target.closest('.task-btn');
        if (!button) { return; }

        const item = button.closest('.task-item');
        const task = findTask(item);
        if (!task) { return; }

        if (button.classList.contains('task-status')) {
            changeStatus(item, task, button);
        } else if (button.classList.contains('task-edit')) {
            if (item.classList.contains('is-editing')) { saveEdit(item, task, button); }
            else { openEdit(item, task, button); }
        } else if (button.classList.contains('task-remove')) {
            removeTask(item, task);
        }
    });

    /* Enter saves an edit, Escape cancels it */
    taskList.addEventListener('keydown', (e) => {
        if (!e.target.classList.contains('edit-input')) { return; }

        const item = e.target.closest('.task-item');
        const task = findTask(item);
        const editButton = $('.task-edit', item);

        if (e.key === 'Enter') { e.preventDefault(); saveEdit(item, task, editButton); }
        if (e.key === 'Escape') { e.stopPropagation(); closeEdit(item, task, editButton); }
    });

    /* CLEAR ALL: needs a second click to confirm */
    let clearArmed = false;
    let clearTimer = null;

    function disarmClear() {
        clearArmed = false;
        taskClear.textContent = 'Clear all';
        taskClear.classList.remove('is-armed');
    }

    taskClear.addEventListener('click', () => {
        if (tasks.length === 0) {
            showToast('There is nothing to clear.', 'info');
            return;
        }

        if (!clearArmed) {
            clearArmed = true;
            taskClear.textContent = 'Click again to confirm';
            taskClear.classList.add('is-armed');
            clearTimer = setTimeout(disarmClear, 3000);
            return;
        }

        clearTimeout(clearTimer);
        disarmClear();

        $$('.task-item', taskList).forEach((item) => {
            item.classList.add('is-removing');
            setTimeout(() => item.remove(), 300);
        });

        tasks = [];
        saveTasks();
        updateStats();
        syncView();
        showToast('All deployments cleared.', 'info');
    });

    /* First display */
    tasks.forEach((task) => taskList.appendChild(createTaskItem(task)));
    updateStats();
    syncView();


    /* ---------- 10. LIVE DEVOPS TOOL RADAR: fetch JSON from an API and display it ---------- */

    const apiSection = $('#api');
    const apiBody = $('#api-body');
    const apiStatusText = $('#api-status-text');
    const apiErrorBox = $('#api-error');
    const apiErrorText = $('#api-error-text');
    const apiWarning = $('#api-warning');
    const apiEmpty = $('#api-empty');
    const apiTableWrap = $('#api-table-wrap');
    const apiFilter = $('#api-filter');
    const apiSort = $('#api-sort');
    const apiRefresh = $('#api-refresh');
    const apiRetry = $('#api-retry');
    const apiSimulate = $('#api-simulate');

    const API_ROOT = 'https://api.github.com/repos/';
    const API_TIMEOUT = 8000;                        /* give up after 8 seconds */
    const CACHE_KEY = 'devops-radar-v1';
    const CACHE_MINUTES = 10;

    const TOOLS = [
        { name: 'Kubernetes', repo: 'kubernetes/kubernetes' },
        { name: 'Docker (Moby)', repo: 'moby/moby' },
        { name: 'Jenkins', repo: 'jenkinsci/jenkins' },
        { name: 'Prometheus', repo: 'prometheus/prometheus' },
        { name: 'Grafana', repo: 'grafana/grafana' },
        { name: 'Terraform', repo: 'hashicorp/terraform' }
    ];

    const COLUMNS = ['Tool', 'Latest release', 'Stars', 'Forks', 'Open issues', 'Language', 'Last push'];

    let radar = [];                                  /* the records received from the API */
    let apiLoading = false;


    /* --- Request helper: fetch + timeout + readable errors --- */

    async function fetchJSON(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/vnd.github+json' },
                signal: controller.signal
            });

            if (!response.ok) {
                const error = new Error('HTTP ' + response.status);
                error.status = response.status;
                error.rateLimited = response.status === 429 ||
                    (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0');
                throw error;
            }

            return await response.json();             /* the JSON text becomes a JavaScript object */
        } finally {
            clearTimeout(timer);                      /* always stop the timer, success or not */
        }
    }

    function describeError(error) {
        if (error.name === 'AbortError') { return 'The server took too long to answer. Please try again.'; }
        if (error.rateLimited) { return 'The free API request limit has been reached. Please wait a few minutes and try again.'; }
        if (error.status === 404) { return 'The requested data was not found (error 404).'; }
        if (error.status >= 500) { return 'The API server has a problem (error ' + error.status + '). Please try again later.'; }
        if (error.status) { return 'The API refused the request (error ' + error.status + ').'; }
        return 'Network problem: check your internet connection and try again.';
    }


    /* --- Turn one API answer into a simple record --- */

    async function loadTool(tool) {
        const [info, release] = await Promise.all([
            fetchJSON(API_ROOT + tool.repo),
            fetchJSON(API_ROOT + tool.repo + '/releases/latest').catch(() => null)   /* a missing release is not fatal */
        ]);

        return {
            name: tool.name,
            url: String(info.html_url || ''),
            stars: Number(info.stargazers_count) || 0,
            forks: Number(info.forks_count) || 0,
            issues: Number(info.open_issues_count) || 0,
            language: info.language || 'n/a',
            pushed: info.pushed_at || '',
            version: release && release.tag_name ? String(release.tag_name) : 'n/a'
        };
    }


    /* --- Small cache so refreshing the page does not use up the free request limit --- */

    function readCache() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY));
            if (saved && Array.isArray(saved.data) && Date.now() - saved.time < CACHE_MINUTES * 60000) {
                return saved.data;
            }
        } catch (err) { /* storage blocked or unreadable: just load again */ }
        return null;
    }

    function saveCache(data) {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: data })); }
        catch (err) { /* storage unavailable: ignore */ }
    }


    /* --- Loading indicator --- */

    function setStatus(text) {
        apiStatusText.textContent = text;
    }

    function setLoading(on) {
        apiLoading = on;
        apiSection.classList.toggle('is-loading', on);            /* shows the spinner */
        apiTableWrap.setAttribute('aria-busy', String(on));
        [apiRefresh, apiRetry, apiSimulate].forEach((button) => { button.disabled = on; });
        apiRefresh.textContent = on ? 'Loading...' : 'Refresh data';
    }

    /* Grey placeholder rows while the data is on its way */
    function showSkeleton(rows) {
        apiBody.textContent = '';

        for (let i = 0; i < rows; i++) {
            const tr = document.createElement('tr');

            COLUMNS.forEach((label) => {
                const td = document.createElement('td');
                const bar = document.createElement('span');
                td.setAttribute('data-label', label);
                bar.className = 'skeleton';
                td.appendChild(bar);
                tr.appendChild(td);
            });

            apiBody.appendChild(tr);
        }
    }


    /* --- Display: build the table and the summary cards from the data --- */

    function timeAgo(iso) {
        const then = new Date(iso).getTime();
        if (Number.isNaN(then)) { return 'n/a'; }

        const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
        const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];

        for (const [unit, size] of units) {
            const count = Math.floor(seconds / size);
            if (count >= 1) { return count + ' ' + unit + (count > 1 ? 's' : '') + ' ago'; }
        }
        return 'just now';
    }

    function createRow(record) {
        const tr = document.createElement('tr');

        const name = document.createElement('a');
        name.textContent = record.name;
        if (record.url.startsWith('https://github.com/')) {
            name.href = record.url;
            name.target = '_blank';
            name.rel = 'noopener noreferrer';
        }

        const language = document.createElement('span');
        language.className = 'lang-badge';
        language.textContent = record.language;

        const cells = [
            [COLUMNS[0], name],
            [COLUMNS[1], record.version],
            [COLUMNS[2], record.stars.toLocaleString()],
            [COLUMNS[3], record.forks.toLocaleString()],
            [COLUMNS[4], record.issues.toLocaleString()],
            [COLUMNS[5], language],
            [COLUMNS[6], timeAgo(record.pushed)]
        ];

        cells.forEach(([label, content]) => {
            const td = document.createElement('td');
            td.setAttribute('data-label', label);

            if (typeof content === 'string') { td.textContent = content; }
            else { td.appendChild(content); }

            tr.appendChild(td);
        });

        return tr;
    }

    function renderStats() {
        const byStars = radar.slice().sort((a, b) => b.stars - a.stars);
        const byDate = radar.slice().sort((a, b) => new Date(b.pushed) - new Date(a.pushed));

        $('#api-stat-count').textContent = radar.length;
        $('#api-stat-stars').textContent = radar.reduce((sum, r) => sum + r.stars, 0).toLocaleString();
        $('#api-stat-top').textContent = byStars.length ? byStars[0].name : '-';
        $('#api-stat-recent').textContent = byDate.length ? byDate[0].name : '-';
    }

    function renderTable() {
        const query = apiFilter.value.trim().toLowerCase();
        const key = apiSort.value;

        const rows = radar
            .filter((r) => [r.name, r.language, r.version].join(' ').toLowerCase().includes(query))
            .sort((a, b) => {
                if (key === 'name') { return a.name.localeCompare(b.name); }
                if (key === 'pushed') { return new Date(b.pushed) - new Date(a.pushed); }
                return b[key] - a[key];                       /* stars, forks, issues: biggest first */
            });

        apiBody.textContent = '';
        rows.forEach((record) => apiBody.appendChild(createRow(record)));

        if (radar.length > 0 && rows.length === 0) {
            apiEmpty.textContent = 'No tools match "' + apiFilter.value.trim() + '".';
            apiEmpty.hidden = false;
        } else {
            apiEmpty.hidden = true;
        }
    }

    function renderAll() {
        renderStats();
        renderTable();
    }


    /* --- Main flow: loading, success, error and finally --- */

    async function runLoad({ force = false, simulate = false } = {}) {
        if (apiLoading) { return; }

        apiErrorBox.hidden = true;
        apiWarning.hidden = true;
        apiEmpty.hidden = true;

        /* Test button: ask for a page that does not exist so the error handling can be seen */
        const list = simulate ? [{ name: 'Missing tool', repo: 'devops-solutions/does-not-exist' }] : TOOLS;

        if (!force && !simulate) {
            const cached = readCache();
            if (cached) {
                radar = cached;
                renderAll();
                setStatus('Showing data saved in this browser (under ' + CACHE_MINUTES + ' minutes old). Press Refresh for the latest.');
                return;
            }
        }

        setLoading(true);
        showSkeleton(list.length);
        setStatus('Loading data from the GitHub API...');

        try {
            const results = await Promise.allSettled(list.map(loadTool));
            const loaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
            const failed = list.filter((tool, i) => results[i].status === 'rejected').map((tool) => tool.name);

            if (loaded.length === 0) { throw results[0].reason; }   /* every request failed */

            radar = loaded;
            renderAll();
            setStatus('Updated at ' + new Date().toLocaleTimeString() + '.');

            if (failed.length > 0) {
                apiWarning.textContent = 'Could not load: ' + failed.join(', ') + '. Showing the rest.';
                apiWarning.hidden = false;
            } else {
                saveCache(loaded);
                showToast('Live data loaded.', 'success');
            }
        } catch (error) {
            radar = [];
            renderAll();                                           /* empties the table and the cards */
            apiErrorText.textContent = describeError(error);
            apiErrorBox.hidden = false;
            setStatus('Loading failed.');
            showToast('Could not load live data.', 'error');
        } finally {
            setLoading(false);                                     /* runs on success and on error */
        }
    }

    apiFilter.addEventListener('input', renderTable);
    apiSort.addEventListener('change', renderTable);
    apiRefresh.addEventListener('click', () => runLoad({ force: true }));
    apiRetry.addEventListener('click', () => runLoad({ force: true }));
    apiSimulate.addEventListener('click', () => runLoad({ simulate: true }));

    /* Load the data only when the section is about to be seen */
    if ('IntersectionObserver' in window) {
        const apiObserver = new IntersectionObserver((entries, observer) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                runLoad();
            }
        }, { rootMargin: '300px 0px' });

        apiObserver.observe(apiSection);
    } else {
        runLoad();
    }
});