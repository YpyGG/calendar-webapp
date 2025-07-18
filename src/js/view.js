// view.js — Все функции рендера и работы с DOM для календаря
import { getState, getConfig, calculateMonthlyStats } from './service.js';
import { generateRandomColor, isLightColor } from './utils.js';

// --- Утилиты для DOM ---
export function qs(selector, parent = document) {
  const el = parent.querySelector(selector);
  if (!el) console.warn(`Элемент не найден: ${selector}`);
  return el;
}
export function qsa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

// --- Рендер оболочки приложения ---
export function renderAppShell() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <div class="container" id="appContainer">
      <header class="header">
        <div class="user-info" id="userInfo"></div>
        <h1 id="mainCalendarHeading">Календарь дежурств</h1>
        <div class="month-year-selectors">
          <select class="month-selector" id="monthSelector"></select>
          <select class="year-selector" id="yearSelector"></select>
        </div>
        <button class="theme-toggle-btn" data-action="toggleTheme" aria-label="Переключить тему">&#9728;</button>
        <div class="top-controls-group" id="topControls"></div>
      </header>
      <main class="main-content" id="appMainContent">
        <nav class="tab-navigation" id="tabNavigation" aria-label="Главное меню">
          <button class="tab-button btn" data-action="switchTab" data-tab="duty">График дежурств</button>
          <button class="tab-button btn" data-action="switchTab" data-tab="technician">График техников</button>
          <button class="tab-button btn" data-action="switchTab" data-tab="general">Общий график</button>
        </nav>
        <div class="section-container" aria-labelledby="mainCalendarHeading">
          <div id="dutyTab" class="tab-content" data-calendar-type="duty"></div>
          <div id="technicianTab" class="tab-content" data-calendar-type="technician"></div>
          <div id="generalTab" class="tab-content" data-calendar-type="general"></div>
        </div>
        <div id="editModeBtnWrapper" style="display:flex;justify-content:center;margin-top:20px;">
          <button class="btn btn--edit-mode" id="toggleEditModeBtn" data-action="toggleEditMode" aria-expanded="false">Редактировать</button>
        </div>
        <div class="action-buttons-wrapper hidden" id="actionButtons" style="margin-top: 15px;">
          <button class="btn btn--save" data-action="save">Сохранить изменения</button>
          <button class="btn btn--cancel" data-action="cancel">Отменить изменения</button>
          <button class="btn btn--clear" data-action="clear">Очистить месяц</button>
        </div>
        <button class="btn btn--toggle" data-action="toggleSection" data-target="statisticsSection" aria-controls="statisticsSection" aria-expanded="false">Статистика</button>
        <section class="section-container hidden-section" id="statisticsSection" aria-labelledby="statisticsHeading">
          <h3 id="statisticsHeading">Статистика дежурств</h3>
          <div class="stats-list" id="statsList"></div>
        </section>
        <button class="btn btn--toggle" data-action="toggleSection" data-target="managementSection" style="margin-top: 10px;" aria-controls="managementSection" aria-expanded="false">Управление</button>
        <section class="section-container hidden-section" id="managementSection" aria-labelledby="managementHeading">
          <h3 id="managementHeading">Управление персоналом</h3>
          <div class="officer-management-controls">
            <input type="text" id="newOfficerName" placeholder="Имя нового сотрудника (Фамилия И.О.)" aria-describedby="newOfficerNameHelp" required minlength="2" maxlength="50" pattern="[А-Яа-яA-Za-z\s]+">
            <button class="btn btn--save" data-action="addOfficer">Добавить</button>
            <span id="newOfficerNameHelp" class="validation-message" aria-live="polite"></span>
          </div>
          <div class="current-officers-list" id="currentOfficersList"></div>
        </section>
      </main>
      <footer></footer>
    </div>
    <div id="modalOverlay" class="modal-overlay" style="display:none;"><div class="modal"><div class="modal-header"><h4>Модалка</h4><button class="modal-close" data-action="closeModal">&times;</button></div><div class="modal-body">Заглушка модального окна</div></div></div>
    <div id="profileModalOverlay" class="modal-overlay" style="display:none;"><div class="modal"><div class="modal-header"><h4>Профиль</h4><button class="modal-close" data-action="closeModal">&times;</button></div><div class="modal-body" id="profileModalBody"></div></div></div>
    <div id="toastContainer" aria-live="polite"></div>
  `;
}

// --- Остальные функции рендера, модалки, уведомления, профили, аватары, статистика, утилиты и т.д. ---
// --- Рендер информации о пользователе ---
export function renderUserInfo() {
  const userInfoContainer = qs('#userInfo');
  if (!userInfoContainer) return;
  const state = getState();
  const user = state.telegramUser || { first_name: 'Гость', username: '' };
  const userProfile = state.users[user.id] || {};
  const userName = userProfile.name || user.first_name || 'Неизвестный';
  const userUsername = user.username ? `@${user.username}` : '';
  const roleText = getConfig().ROLE_NAMES[state.userRole] || 'Гость';
  // Показывать роль только админу
  const roleHtml = state.userRole === 'admin' ? ` | Роль: <span>${roleText}</span>` : '';
  userInfoContainer.innerHTML = `Вы вошли как <span>${sanitize(userName)}</span> ${sanitize(userUsername)}${roleHtml}`;
}

// --- Рендер селекторов месяца и года ---
export function renderMonthAndYearSelectors() {
  const monthSelector = qs('#monthSelector');
  const yearSelector = qs('#yearSelector');
  if (!monthSelector || !yearSelector) return;
  const state = getState();
  // Месяцы
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  monthSelector.innerHTML = months.map((m, i) => `<option value="${i}" ${i===state.currentMonth?'selected':''}>${sanitize(m)}</option>`).join('');
  // Годы
  const currentYear = new Date().getFullYear();
  let options = '';
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    options += `<option value="${i}" ${i===state.year?'selected':''}>${i}</option>`;
  }
  yearSelector.innerHTML = options;
}

// --- Рендер вкладок и кнопок ---
export function renderTabsAndButtons() {
  const state = getState();
  // Вкладки
  qsa('#tabNavigation .tab-button').forEach(btn => {
    if (btn.dataset.tab === state.activeTab) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  qsa('.tab-content').forEach(content => {
    if (content.id === `${state.activeTab}Tab`) content.classList.add('active');
    else content.classList.remove('active');
  });
  // Кнопки действий
  const actionButtons = qs('#actionButtons');
  if (actionButtons) {
    if (state.isEditMode && (state.userRole==='admin'||state.userRole==='boss')) actionButtons.classList.remove('hidden');
    else actionButtons.classList.add('hidden');
  }
}

// --- Рендер всех календарей ---
export function renderAllCalendars() {
  renderCalendar('duty');
  renderCalendar('technician');
  renderCalendar('general');
}

// --- Рендер календаря ---
export function renderCalendar(calendarType) {
  const grid = qs(`#${calendarType}Tab .calendar-grid`) || qs(`#${calendarType}Tab`);
  if (!grid) return;
  const state = getState();
  const year = state.year;
  const month = state.currentMonth;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  let html = '<div class="calendar-grid">';
  ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(day => {
    html += `<div class="day-header">${day}</div>`;
  });
  for (let i = 0; i < firstDayOfWeek; i++) html += '<div class="day-cell empty"></div>';
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = (date.getDay() + 6) % 7;
    let cellClass = 'day-cell';
    if (dayOfWeek >= 5) cellClass += ' weekend';
    if (date.toDateString() === today.toDateString()) cellClass += ' current-day';
    html += `<div class="${cellClass}" data-day="${day}"><div class="day-number">${day}</div><div class="day-entries-container">${createDayEntriesHTML(calendarType, day)}</div></div>`;
  }
  html += '</div>';
  grid.innerHTML = html;
}

// --- Рендер аватаров и назначений в ячейке дня ---
export function createDayEntriesHTML(calendarType, day) {
  const state = getState();
  let assignments = [];
  if (calendarType === 'duty') {
    const duty = state.duties[state.currentMonth]?.[day];
    if (duty) assignments.push({ person: duty, shift: 'ДС' });
  } else if (calendarType === 'technician') {
    assignments = Array.isArray(state.techDuties[state.currentMonth]?.[day]) ? state.techDuties[state.currentMonth][day] : [];
  } else if (calendarType === 'general') {
    const all = [];
    const duty = state.duties[state.currentMonth]?.[day];
    if (duty) all.push({ person: duty, shift: 'ДС' });
    if (Array.isArray(state.techDuties[state.currentMonth]?.[day])) all.push(...state.techDuties[state.currentMonth][day]);
    if (Array.isArray(state.generalSchedule[state.currentMonth]?.[day])) all.push(...state.generalSchedule[state.currentMonth][day]);
    // Удаляем дубликаты
    const map = new Map();
    all.forEach(a => map.set(`${a.person}-${a.shift}`, a));
    assignments = Array.from(map.values());
  }
  if (!assignments.length) return '<div class="avatar empty"></div>';
  // Размер аватара зависит от количества назначений
  let avatarSizeClass = assignments.length === 1 ? 'avatar-single' : assignments.length === 2 ? 'avatar-two' : 'avatar-multiple';
  return assignments.map(a => renderUserAvatar(a.person, avatarSizeClass, a.shift)).join('');
}

// --- Рендер одного аватара пользователя ---
export function renderUserAvatar(userIdentifier, avatarSizeClass = '', shift = '') {
  const state = getState();
  const config = getConfig();
  const user = state.users[userIdentifier] || { name: userIdentifier };
  const bgColor = user.bgColor || generateRandomColor();
  const textColor = user.textColor || '#fff';
  const outlineColor = user.outlineColor || 'rgba(0,191,255,0.4)';
  const initials = user.name?.split(' ').map(n=>n[0]).join('').toUpperCase() || '?';
  // Рендер аксессуаров SVG
  const accessoriesHtml = (user.accessories||[]).map(acc => config.ACCESSORY_ICONS[acc] ? `<div class="accessory ${acc}">${config.ACCESSORY_ICONS[acc]}</div>` : '').join('');
  const shiftShort = shift === 'ДС' ? 'ДС' : (shift ? shift.slice(0,2).toUpperCase() : '');
  if (user.photoURL) {
    return `<div class="avatar ${avatarSizeClass}" style="--bg:${bgColor};--outline:${outlineColor};"><img class="avatar-photo" src="${user.photoURL}" alt="${user.name||''}">${accessoriesHtml}${shiftShort?`<span class="avatar-shift" style="color:${textColor}">${shiftShort}</span>`:''}</div>`;
  } else {
    return `<div class="avatar ${avatarSizeClass}" style="--bg:${bgColor};--outline:${outlineColor};color:${textColor};"><span class="avatar-letters">${initials}</span>${accessoriesHtml}${shiftShort?`<span class="avatar-shift">${shiftShort}</span>`:''}</div>`;
  }
}

// --- Рендер статистики ---
export function renderStatistics() {
  const statsList = qs('#statsList');
  if (!statsList) return;
  const state = getState();
  const stats = {};
  state.officers.forEach(o => { stats[o] = 0; });
  Object.values(state.duties[state.currentMonth] || {}).forEach(officer => {
    if (officer) stats[officer] = (stats[officer] || 0) + 1;
  });
  const sorted = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);
  statsList.innerHTML = '';
  sorted.forEach(officer => {
    const user = state.users[officer] || {};
    const bgColor = user.bgColor || generateRandomColor();
    const textColor = user.textColor || '#fff';
    const item = document.createElement('div');
    item.className = 'stats-item';
    item.innerHTML = `<div class="stats-name" style="background-color:${bgColor};color:${textColor}">${sanitize(officer)}</div><div class="stats-count">${stats[officer]}</div>`;
    statsList.appendChild(item);
  });
}

// --- Рендер списка сотрудников ---
export function renderManagementList() {
  const list = qs('#currentOfficersList');
  if (!list) return;
  const state = getState();
  const isAdmin = state.userRole === 'admin';
  const allPeople = Array.from(new Set([...state.officers, ...state.technicians])).sort();
  list.innerHTML = allPeople.map(name => {
    const user = state.users[name] || { name };
    const avatar = `<span class="avatar" style="background:${user.bgColor||'#4a90e2'};color:${user.textColor||'#fff'};border:2px solid ${user.outlineColor||'#00bfff'};margin-right:8px;">${(user.name||'?').split(' ').map(n=>n[0]).join('').toUpperCase()}${(user.accessories||[]).map(acc=>`<span class='accessory'>${acc}</span>`).join('')}</span>`;
    const editBtn = isAdmin ? `<button class="btn btn--small" data-action="editOfficerProfile" data-name="${name}">Редактировать</button>` : '';
    const delBtn = isAdmin ? `<button class="delete-officer-btn" data-action="deleteOfficer" data-name="${name}" title="Удалить">&times;</button>` : '';
    return `<div class="current-officer-item">${avatar}<span>${sanitize(name)}</span> ${editBtn} ${delBtn}</div>`;
  }).join('');
}

// --- Универсальные уведомления (тосты) ---
export function showNotification(message, type = 'info') {
  const toastContainer = qs('#toastContainer');
  if (!toastContainer) return;
  const notification = document.createElement('div');
  notification.className = `toast ${type}`;
  notification.textContent = sanitize(message);
  toastContainer.appendChild(notification);
  void notification.offsetWidth;
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
    notification.addEventListener('transitionend', () => notification.remove(), { once: true });
  }, 3000);
}

// --- Универсальные модальные оверлеи ---
function getOverlay(type) {
  switch (type) {
    case 'edit': return qs('#editModalOverlay');
    case 'view': return qs('#viewModalOverlay');
    case 'confirm': return qs('#confirmModalOverlay');
    case 'profile': return qs('#profileModalOverlay');
    case 'stats': return qs('#statsModalOverlay');
    case 'summary': return qs('#summaryModalOverlay');
    default: return null;
  }
}

// 1. showDutyModal: заменить input на select с начальниками
export function showDutyModal(day) {
  const overlay = getOverlay('edit');
  if (!overlay) return;
  const modalBody = overlay.querySelector('.modal-body');
  overlay.style.display = 'flex';
  const state = getState();
  state.currentSelectedDay = day;
  modalBody.dataset.calendarType = 'duty';
  // Список начальников
  const bossOfficers = getConfig().INITIAL_DATA.officers.filter(o => [
    'Морозов В.А.', 'Ребраков Т.В.', 'Костырин С.С.', 'Бонадыков В.В.', 'Бурлаков М.Ю.', 'Артемьев А.М.', 'Мефед И.С.'
  ].includes(o));
  const current = state.duties[state.currentMonth][day] || '';
  const options = bossOfficers.map(name => `<option value="${sanitize(name)}" ${name===current?'selected':''}>${sanitize(name)}</option>`).join('');
  modalBody.innerHTML = `
    <select id="dutyNameSelect">${options}</select>
    <button class="btn btn--save" id="saveAssignmentBtn">Сохранить</button>
  `;
}

export function showAssignmentModal(calendarType, day) {
  const overlay = getOverlay('edit');
  if (!overlay) return;
  const modalBody = overlay.querySelector('.modal-body');
  overlay.style.display = 'flex';
  const state = getState();
  state.currentSelectedDay = day;
  modalBody.dataset.calendarType = calendarType;
  const people = calendarType === 'technician' ? state.technicians : Array.from(new Set([...state.officers, ...state.technicians])).sort();
  const peopleOptions = people.map(p => `<option value="${sanitize(p)}">${sanitize(p)}</option>`).join('');
  const shiftOptions = getConfig().SHIFT_TYPES.map(s => `<option value="${sanitize(s)}">${sanitize(s)}</option>`).join('');
  const key = calendarType === 'technician' ? 'techDuties' : 'generalSchedule';
  const assignments = state[key][state.currentMonth][day] || [];
  modalBody.innerHTML = `
    <div class="assignment-controls">
      <select id="personSelect">${peopleOptions}</select>
      <select id="shiftSelect">${shiftOptions}</select>
      <button class="btn btn--save" id="saveAssignmentBtn">Добавить</button>
    </div>
    <div class="assignments-list-container">
      <h5>Текущие назначения:</h5>
      <div id="assignmentsList">
        ${assignments.length ? assignments.map((a,i) => `<div class="assignment-item"><span>${sanitize(a.person)} (${sanitize(a.shift)})</span><button class="delete-assignment-btn" data-index="${i}">&times;</button></div>`).join('') : 'Нет назначений.'}
      </div>
    </div>
  `;
}

export function showEnlargedDayView(day, calendarType) {
  const overlay = getOverlay('view');
  if (!overlay) return;
  const modalBody = overlay.querySelector('.modal-body');
  overlay.style.display = 'flex';
  const state = getState();
  let assignments = [];
  if (calendarType === 'duty') {
    const duty = state.duties[state.currentMonth]?.[day];
    if (duty) assignments.push({ person: duty, shift: 'ДС' });
  } else if (calendarType === 'technician') {
    assignments = Array.isArray(state.techDuties[state.currentMonth]?.[day]) ? state.techDuties[state.currentMonth][day] : [];
  } else if (calendarType === 'general') {
    const all = [];
    const duty = state.duties[state.currentMonth]?.[day];
    if (duty) all.push({ person: duty, shift: 'ДС' });
    if (Array.isArray(state.techDuties[state.currentMonth]?.[day])) all.push(...state.techDuties[state.currentMonth][day]);
    if (Array.isArray(state.generalSchedule[state.currentMonth]?.[day])) all.push(...state.generalSchedule[state.currentMonth][day]);
    const map = new Map();
    all.forEach(a => map.set(`${a.person}-${a.shift}`, a));
    assignments = Array.from(map.values());
  }
  modalBody.innerHTML = `<h4>Назначения на ${day} число</h4>` +
    (assignments.length ? assignments.map(a => `<div class="assignment-item"><span>${sanitize(a.person)} (${sanitize(a.shift)})</span></div>`).join('') : '<div>Нет назначений.</div>');
}

export function showConfirmModal(message) {
  return new Promise(resolve => {
    const overlay = getOverlay('confirm');
    if (!overlay) return resolve(false);
    overlay.style.display = 'flex';
    overlay.querySelector('.modal-header h4').textContent = 'Подтверждение';
    overlay.querySelector('.modal-body').innerHTML = `<p>${sanitize(message)}</p><button class="btn btn--save" id="confirmModalYes">Да</button> <button class="btn btn--cancel" id="confirmModalNo">Нет</button>`;
    window.confirmModalResolve = (result) => {
      resolve(result);
      overlay.style.display = 'none';
    };
  });
}

// --- Новый компонент ProfileCard ---
export function renderProfileCard(user, role, isAdmin) {
  // user: объект пользователя, role: строка роли, isAdmin: bool
  const accessories = getConfig().ACCESSORY_ICONS;
  const selectedAcc = user.accessories || [];
  return `
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-container">
          <img src="${user.photoURL || '/default-avatar.svg'}" alt="Аватар" class="avatar-image" id="avatarPreview">
          <button class="avatar-edit-btn" data-action="editAvatar" title="Изменить фото">
            <i class="icon-camera"></i>
          </button>
        </div>
        <div class="profile-info">
          <h3 class="profile-name" id="profileName">${sanitize(user.name || '—')}</h3>
          <span class="profile-role">${sanitize(role)}</span>
        </div>
      </div>
      <div class="profile-fields">
        <div class="field-group">
          <label>Имя ${isAdmin ? '' : '(только админ)'}</label>
          <input type="text" id="nameInput" class="field-input" value="${sanitize(user.name || '')}" ${isAdmin ? '' : 'disabled'}>
          ${isAdmin ? '<button class="field-edit-btn" data-action="toggleNameEdit">✏️</button>' : ''}
        </div>
        <div class="field-group">
          <label>Цвет темы</label>
          <div class="color-picker-wrapper">
            <div class="color-preview" id="colorPreview" style="background:${user.bgColor || '#4a90e2'}"></div>
            <button class="color-picker-btn" data-action="openColorPicker">Выбрать цвет</button>
          </div>
        </div>
        <div class="field-group">
          <label>Украшения</label>
          <div class="decorations-grid">
            ${Object.keys(accessories).map(acc => `
              <div class="decoration-item${selectedAcc.includes(acc) ? ' selected' : ''}" data-decoration="${acc}">
                <span class="icon">${accessories[acc]}</span>
                <span>${acc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function showProfileEditor() {
  const overlay = getOverlay('profile');
  const body = overlay.querySelector('.modal-body');
  const state = getState();
  const userId = state.telegramUser?.id;
  const user = state.users[userId] || {};
  const roleText = getConfig().ROLE_NAMES[state.userRole] || 'Гость';
  const isAdmin = state.userRole === 'admin';
  if (overlay && body) {
    overlay.style.display = 'flex';
    body.innerHTML = renderProfileCard(user, roleText, isAdmin);
    // Если не админ — подсказка
    if (!isAdmin) {
      const nameInput = body.querySelector('#nameInput');
      if (nameInput) {
        const tooltip = document.createElement('div');
        tooltip.className = 'field-tooltip';
        tooltip.textContent = 'Только администратор может изменить имя';
        nameInput.parentNode.appendChild(tooltip);
      }
    }
  }
}

export function showMyStats() {
  const overlay = getOverlay('stats');
  if (!overlay) return;
  const body = overlay.querySelector('.modal-body');
  overlay.style.display = 'flex';
  const state = getState();
  const userId = state.telegramUser?.id;
  const user = state.users[userId] || {};
  const month = state.currentMonth;
  const year = state.year;
  const monthName = getConfig().MONTHS[month];
  const stats = calculateMonthlyStats(user.name, month, year);
  // Список смен по дням
  let shiftList = '';
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayKey = day.toString();
    let dayShifts = [];
    if (state.duties[month]?.[dayKey] === user.name) dayShifts.push('ДС');
    (state.techDuties[month]?.[dayKey] || []).forEach(a => { if (a.person === user.name) dayShifts.push(a.shift); });
    (state.generalSchedule[month]?.[dayKey] || []).forEach(a => { if (a.person === user.name) dayShifts.push(a.shift); });
    if (dayShifts.length) {
      shiftList += `<li>${sanitize(day)} ${sanitize(monthName)}: ${dayShifts.map(s=>sanitize(s)).join(', ')}</li>`;
    }
  }
  body.innerHTML = `
    <h3>Статистика за ${sanitize(monthName)} ${sanitize(year)}</h3>
    <div><b>Смен:</b> ${sanitize(stats.shifts)}<br><b>Часов:</b> ${sanitize(stats.hours)}</div>
    <ul style="margin-top:10px;">${shiftList || '<li>Нет смен</li>'}</ul>
  `;
}

export function closeModal(type) {
  if (type) {
    const overlay = getOverlay(type);
    if (overlay) overlay.style.display = 'none';
  } else {
    // Закрыть все модалки
    ['edit','view','confirm','profile','stats','summary'].forEach(t => {
      const overlay = getOverlay(t);
      if (overlay) overlay.style.display = 'none';
    });
  }
}

// --- Управление видимостью разделов и кнопок ---
export function updateManagementSectionVisibility() {
  const section = qs('#managementSection');
  const toggleButton = qs('[data-target="managementSection"]');
  const state = getState();
  const show = state.userRole === 'admin' || state.userRole === 'boss';
  if (toggleButton) toggleButton.style.display = show ? 'block' : 'none';
  if (section && !show) section.classList.add('hidden-section');
}
export function updateEditModeButtonVisibility() {
  const editBtn = qs('#toggleEditModeBtn');
  const state = getState();
  if (editBtn) {
    if (state.userRole === 'admin' || state.userRole === 'boss') {
      editBtn.style.display = 'flex';
      if (state.isEditMode) editBtn.classList.add('active-edit-mode');
      else editBtn.classList.remove('active-edit-mode');
    } else {
      editBtn.style.display = 'none';
    }
  }
}

// --- Color Picker Modal ---
export function renderColorWheelModal(currentColor, onSave) {
  // Создаём модалку с canvas-колесом
  let modal = document.getElementById('colorPickerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'colorPickerModal';
    modal.className = 'color-picker-modal';
    modal.innerHTML = `
      <div class="color-picker-content">
        <h3>Выберите цвет</h3>
        <div class="color-wheel-container"></div>
        <div class="color-preview" id="colorWheelPreview" style="background:${currentColor}"></div>
        <div class="color-actions">
          <button id="colorPickerCancelBtn">Отмена</button>
          <button id="colorPickerSaveBtn">Сохранить</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  // Создаём canvas-колесо
  const container = modal.querySelector('.color-wheel-container');
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  container.appendChild(canvas);
  drawColorWheel(canvas);
  // Выбор цвета по клику
  canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const rgb = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
    modal.querySelector('#colorWheelPreview').style.background = rgb;
    modal.dataset.selectedColor = rgb;
  });
  // Кнопки
  modal.querySelector('#colorPickerCancelBtn').onclick = () => { modal.style.display = 'none'; };
  modal.querySelector('#colorPickerSaveBtn').onclick = () => {
    const color = modal.dataset.selectedColor || currentColor;
    modal.style.display = 'none';
    if (onSave) onSave(color);
  };
}

function drawColorWheel(canvas) {
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;
  for (let angle = 0; angle < 360; angle++) {
    const startAngle = (angle - 1) * Math.PI / 180;
    const endAngle = angle * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
    ctx.stroke();
  }
}

// --- Кастомный dropdown с иконками ---
export function createCustomDropdown(options, selectedValue, onSelect) {
  // options: [{text, value, icon}], selectedValue: value, onSelect: callback
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-dropdown';
  const selected = document.createElement('div');
  selected.className = 'dropdown-selected';
  const selectedOption = options.find(o => o.value === selectedValue) || options[0];
  selected.innerHTML = `
    <span class="selected-value">${selectedOption.icon || ''} ${selectedOption.text}</span>
    <i class="dropdown-arrow">▼</i>
  `;
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  options.forEach(option => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `<span class="item-icon">${option.icon || ''}</span> <span class="item-text">${option.text}</span>`;
    if (option.value === selectedValue) item.classList.add('selected');
    item.onclick = () => {
      selected.querySelector('.selected-value').innerHTML = `${option.icon || ''} ${option.text}`;
      menu.style.display = 'none';
      if (onSelect) onSelect(option.value);
      // Визуальная обратная связь
      selected.classList.add('option-selected');
      setTimeout(() => selected.classList.remove('option-selected'), 300);
    };
    menu.appendChild(item);
  });
  dropdown.appendChild(selected);
  dropdown.appendChild(menu);
  selected.onclick = () => {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  };
  // Закрытие при клике вне
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) menu.style.display = 'none';
  });
  return dropdown;
}
