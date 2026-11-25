/* DevOps Solutions: interactive animations
   Menu, service-card details, pipeline simulator, toasts, lightbox, form feedback.
   The page still works without JavaScript. */
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
});