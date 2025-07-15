// controller.js — Делегирование событий и логика взаимодействия пользователя
import * as service from './service.js';
import * as view from './view.js';

// 1. Используем DOMPurify глобально
const sanitize = window.DOMPurify ? window.DOMPurify.sanitize : (x) => x;

export function initController() {
  // Инициализация данных и рендера
  service.initTelegram();
  service.loadTheme();
  service.loadData();
  view.renderAppShell();
  view.renderUserInfo();
  view.renderMonthAndYearSelectors();
  view.renderTabsAndButtons();
  view.renderAllCalendars();
  view.renderStatistics();
  view.renderManagementList();
  view.updateManagementSectionVisibility();
  view.updateEditModeButtonVisibility();

  // Делегирование кликов
  document.body.addEventListener('click', handleClick);
  // Делегирование изменений (select, input)
  document.body.addEventListener('change', handleChange);
}

async function handleClick(e) {
  const target = e.target;
  const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;
  if (action) {
    switch (action) {
      case 'toggleTheme':
        service.toggleTheme();
        view.renderAppShell();
        break;
      case 'switchTab':
        service.getState().activeTab = target.dataset.tab;
        view.renderTabsAndButtons();
        view.renderAllCalendars();
        break;
      case 'toggleEditMode':
        service.toggleEditMode();
        view.renderTabsAndButtons();
        view.updateEditModeButtonVisibility();
        break;
      case 'save':
        service.saveData();
        view.renderTabsAndButtons();
        view.renderAllCalendars();
        view.renderStatistics();
        view.renderManagementList();
        break;
      case 'cancel':
        service.loadData();
        view.renderTabsAndButtons();
        view.renderAllCalendars();
        view.renderStatistics();
        view.renderManagementList();
        break;
      case 'clear': {
        // Очистка месяца через асинхронную модалку (view.showConfirmModal)
        const confirmed = await view.showConfirmModal('Вы уверены, что хотите очистить месяц?');
        if (!confirmed) return;
        const tab = service.getState().activeTab;
        if (tab === 'duty') service.getState().duties[service.getState().currentMonth] = {};
        if (tab === 'technician') service.getState().techDuties[service.getState().currentMonth] = {};
        if (tab === 'general') service.getState().generalSchedule[service.getState().currentMonth] = {};
        service.saveData();
        view.renderAllCalendars();
        view.renderStatistics();
      }
      case 'addOfficer': {
        const input = document.getElementById('newOfficerName');
        const name = sanitize(input.value.trim());
        const result = service.addOfficer(name);
        if (result.error) return view.showNotification(result.error, 'error');
        view.renderManagementList();
        input.value = '';
        view.showNotification('Сотрудник добавлен', 'success');
        break;
      }
      case 'deleteOfficer': {
        const name = target.dataset.name;
        if (!name) return;
        const confirmed = await view.showConfirmModal(`Удалить сотрудника ${name}?`);
        if (!confirmed) return;
        const result = service.deleteOfficer(name);
        if (result.error) return view.showNotification(result.error, 'error');
        view.renderManagementList();
        view.renderAllCalendars();
        view.renderStatistics();
        view.showNotification('Сотрудник удалён', 'success');
        break;
      }
      case 'editOfficerProfile': {
        const name = target.dataset.name;
        if (name) view.showOfficerProfileModal(name);
        break;
      }
      case 'openProfileEditor':
        view.showProfileEditor();
        break;
      case 'openMyStats':
        view.showMyStats();
        break;
      case 'closeModal':
        view.closeModal();
        break;
      default:
        break;
    }
  }
  // Клик по ячейке календаря
  const dayCell = target.closest('.day-cell:not(.empty)');
  if (dayCell) {
    const state = service.getState();
    const day = parseInt(dayCell.dataset.day, 10);
    const tabContent = dayCell.closest('.tab-content');
    const calendarType = tabContent ? tabContent.dataset.calendarType : state.activeTab;
    if (state.isEditMode && (state.userRole==='admin'||state.userRole==='boss')) {
      // Открыть модалку назначения смены
      if (calendarType === 'duty') {
        if (view.showDutyModal) view.showDutyModal(day);
      } else {
        if (view.showAssignmentModal) view.showAssignmentModal(calendarType, day);
      }
    } else {
      // Открыть просмотр дня
      if (view.showEnlargedDayView) view.showEnlargedDayView(day, calendarType);
    }
  }
  // Кнопки подтверждения в модалке
  if (target.id === 'confirmModalYes' && typeof window.confirmModalResolve === 'function') {
    window.confirmModalResolve(true);
    view.closeModal();
  }
  if (target.id === 'confirmModalNo' && typeof window.confirmModalResolve === 'function') {
    window.confirmModalResolve(false);
    view.closeModal();
  }
  // Сохранение профиля пользователя
  if (target.id === 'saveProfileBtn') {
    const name = sanitize(document.getElementById('profileNameInput').value.trim());
    const photoURL = sanitize(document.getElementById('profilePhoto')?.value.trim() || '');
    const bgColor = sanitize(document.getElementById('profileBg')?.value || '#4a90e2');
    const textColor = sanitize(document.getElementById('profileFg')?.value || '#fff');
    const outlineColor = sanitize(document.getElementById('profileOutline')?.value || '#00bfff');
    const accessories = sanitize(document.getElementById('profileAccInput')?.value.split(',').map(s=>s.trim()).filter(Boolean) || []);
    const userId = service.getState().telegramUser?.id;
    if (userId) {
      service.getState().users[userId] = { ...service.getState().users[userId], name, photoURL, bgColor, textColor, outlineColor, accessories };
      service.saveData();
      view.closeModal();
      view.renderUserInfo();
      view.renderAllCalendars();
      view.showNotification('Профиль сохранён', 'success');
    }
  }
  // Сохранение назначения смены
  if (target.id === 'saveAssignmentBtn') {
    const modalBody = target.closest('.modal-body');
    if (!modalBody) return;
    const calendarType = sanitize(modalBody.dataset.calendarType || service.getState().activeTab);
    const day = service.getState().currentSelectedDay;
    if (calendarType === 'duty') {
      const name = sanitize(document.getElementById('dutyNameSelect')?.value.trim());
      const result = service.assignDuty(day, name);
      if (result.error) return view.showNotification(result.error, 'error');
      service.saveData();
      view.closeModal();
      view.renderAllCalendars();
      view.renderStatistics();
      view.showNotification('Дежурный назначен', 'success');
    } else {
      const person = sanitize(document.getElementById('personSelect')?.value || document.getElementById('personInput')?.value);
      const shift = sanitize(document.getElementById('shiftSelect')?.value || document.getElementById('shiftInput')?.value);
      const result = service.addAssignment(day, person, shift, calendarType);
      if (result.error) return view.showNotification(result.error, 'error');
      service.saveData();
      view.closeModal();
      view.renderAllCalendars();
      view.renderStatistics();
      view.showNotification('Назначение сохранено', 'success');
    }
  }
  // Удаление назначения смены
  if (target.classList.contains('delete-assignment-btn')) {
    const modalBody = target.closest('.modal-body');
    if (!modalBody) return;
    const calendarType = sanitize(modalBody.dataset.calendarType || service.getState().activeTab);
    const day = service.getState().currentSelectedDay;
    const idx = parseInt(target.dataset.index, 10);
    const result = service.deleteAssignment(day, idx, calendarType);
    if (result.error) return view.showNotification(result.error, 'error');
    service.saveData();
    view.renderAllCalendars();
    view.renderStatistics();
    view.showNotification('Назначение удалено', 'info');
  }
}

function handleChange(e) {
  const target = e.target;
  if (target.id === 'monthSelector') {
    service.changeMonth(target.value);
    view.renderAllCalendars();
    view.renderStatistics();
  }
  if (target.id === 'yearSelector') {
    service.changeYear(target.value);
    view.renderAllCalendars();
    view.renderStatistics();
  }
  // Смена роли сотрудника (реализовать по необходимости)
}

// Для запуска контроллера из index.html
initController();
