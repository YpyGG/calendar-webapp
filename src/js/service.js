// service.js — Полный state и бизнес-логика для календаря

import { generateRandomColor } from './utils.js';

// --- STATE ---
const STATE = {
  telegramUser: null, // Объект пользователя Telegram
  userRole: 'guest', // Роль пользователя
  year: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  activeTab: 'duty',
  isEditMode: false,
  hasUnsavedChanges: false,
  duties: {},
  techDuties: {},
  generalSchedule: {},
  officers: [],
  technicians: [],
  users: {}, // Глобальный объект профилей
  confirmModalResolve: null,
  currentSelectedDay: null,
  theme: 'dark',
};

// --- CONFIG ---
const CONFIG = {
  ROLES: {
    123456789: 'admin',
    987654321: 'boss',
    111222333: 'worker',
    'local_test_admin_id': 'admin',
  },
  ROLE_NAMES: {
    admin: 'Администратор',
    boss: 'Начальник',
    worker: 'Работяга',
    guest: 'Гость',
  },
  STORAGE_KEYS: {
    DUTIES: 'calendar_duties',
    TECH_DUTIES: 'calendar_tech_duties',
    GENERAL_SCHEDULE: 'calendar_general_schedule',
    OFFICERS: 'calendar_officers',
    TECHNICIANS: 'calendar_technicians',
    USERS: 'calendar_users',
    THEME: 'app_theme',
    USER_ROLE: 'calendar_user_role',
  },
  MONTHS: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  SHIFT_TYPES: ["8", "ДС", "День караул", "Ночь караул", "Отсыпной", "Выходной", "Отпуск", "Больничный"],
  SHIFT_HOURS: {
    "8": 8,
    "ДС": 24,
    "День караул": 12,
    "Ночь караул": 12,
    "Отсыпной": 0,
    "Выходной": 0,
    "Отпуск": 0,
    "Больничный": 0
  },
  NO_DUTY_LABEL: "Нет дежурства",
  NAME_REGEX: /^[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.([А-ЯЁ]\.)?$/, // Пример: Фамилия И.О. или Фамилия И.О.
  INITIAL_DATA: {
    officers: ["Морозов В.А.", "Ребраков Т.В.", "Костырин С.С.", "Бонадыков В.В.", "Бурлаков М.Ю.", "Артемьев А.М.", "Мефед И.С."],
    technicians: ["Ребраков Т.В.", "Морозов В.А.", "Кузавлев П.С.", "Лебедев А.В.", "Денщиков А.А."],
    julyDuties: { "1": "Ребраков Т.В.", "2": "Костырин С.С.", "3": "Морозов В.А.", "4": "Ребраков Т.В.", "6": "Костырин С.С.", "7": "Костырин С.С.", "8": "Ребраков Т.В.", "9": "Морозов В.А.", "10": "Морозов В.А.", "11": "Костырин С.С.", "12": "Ребраков Т.В.", "13": "Морозов В.А.", "14": "Костырин С.С.", "15": "Ребраков Т.В.", "16": "Морозов В.А.", "17": "Ребраков Т.В.", "18": "Ребраков Т.В.", "19": "Костырин С.С.", "20": "Морозов В.А.", "21": "Костырин С.С.", "22": "Ребраков Т.В.", "23": "Морозов В.А.", "24": "Костырин С.С.", "25": "Ребраков Т.В.", "26": "Морозов В.А.", "27": "Костырин С.С.", "28": "Костырин С.С.", "29": "Морозов В.А.", "30": "Костырин С.С.", "31": "Ребраков Т.В." }
  },
  ACCESSORY_ICONS: {
    crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10l2-6h10l2 6M2 10h20M6 14l-2 8h16l-2-8M12 2v2M9 5l1 1M15 5l-1 1"/></svg>`,
    tie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="navy" stroke="white" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L9 9h6l-3 7L7 22l5-3 5 3-3-6 3-7h-6z"/></svg>`,
    horns: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="brown" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c-1.1 0-2 .9-2 2s.9 2 2 2h.5c.3 0 .6-.1.8-.4l.7-.7c.3-.3.8-.4 1.2-.2l.6.3c.4.2.9.2 1.3 0l.6-.3c.4-.2.9-.1 1.2.2l.7.7c.2.2.5.4.8.4H20c1.1 0 2-.9 2-2s-.9-2-2-2h-1.5c-.3 0-.6.1-.8.4l-.7.7c-.3.3-.8.4-1.2.2l-.6-.3c-.4-.2-.9-.2-1.3 0l-.6.3c-.4.2-.9-.1 1.2-.2l-.7-.7c-.2-.2-.5-.4-.8-.4H4zM4 12V6c0-1.1.9-2 2-2h.5c.3 0 .6.1.8.4l.7.7c.3.3.8.4 1.2.2l.6-.3c.4-.2.9-.2 1.3 0l.6.3c.4.2.9.1 1.2-.2l-.7-.7c-.2-.2-.5-.4-.8-.4H20c1.1 0 2 .9 2 2v6"/></svg>`,
    medal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="silver" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4v8l4 4M12 4l-4 4"/></svg>`,
    halo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" stroke="orange" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="5"/><path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10A10 10 0 0 0 12 2z" fill="none"/></svg>`,
    glow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="yellow" stroke="orange" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="yellow" opacity="0.5"/><path d="M12 2v20M2 12h20M4.9 4.9l14.1 14.1M4.9 19.1l14.1-14.1" stroke="orange" stroke-opacity="0.8"/></svg>`
  }
};

// --- Экспортируемые функции ---
export function getState() { return STATE; }
export function getConfig() { return CONFIG; }

// --- Telegram и роли ---
export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    STATE.telegramUser = tg.initDataUnsafe.user;
    STATE.userRole = CONFIG.ROLES[STATE.telegramUser?.id] || 'guest';
    tg.expand();
  } else {
    // Локальный тест
    STATE.telegramUser = { id: 'local_test_admin_id', first_name: 'Морозов В.А.', username: 'morozov_va' };
    STATE.userRole = CONFIG.ROLES['local_test_admin_id'] || 'guest';
  }
}
export function getCurrentRole() { return STATE.userRole; }
export function isAdmin() { return STATE.userRole === 'admin'; }
export function isBossOrAdmin() { return STATE.userRole === 'admin' || STATE.userRole === 'boss'; }

// --- Работа с темой ---
export function loadTheme() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
  STATE.theme = saved || 'dark';
  document.body.dataset.theme = STATE.theme;
}
export function saveTheme(theme) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
  STATE.theme = theme;
  document.body.dataset.theme = theme;
}
export function toggleTheme() {
  const newTheme = STATE.theme === 'dark' ? 'light' : 'dark';
  saveTheme(newTheme);
}

// --- Работа с данными (load/save) ---
function getStorageKey(key) {
  // USERS — глобальный, остальные — общие
  return key;
}
export function loadData() {
  const load = (key, def) => {
    try {
      const item = localStorage.getItem(getStorageKey(CONFIG.STORAGE_KEYS[key]));
      return item ? JSON.parse(item) : def;
    } catch { return def; }
  };
  STATE.duties = load('DUTIES', {});
  STATE.techDuties = load('TECH_DUTIES', {});
  STATE.generalSchedule = load('GENERAL_SCHEDULE', {});
  STATE.officers = load('OFFICERS', []);
  STATE.technicians = load('TECHNICIANS', []);
  STATE.users = load('USERS', {});
  // Инициализация профилей для всех сотрудников
  const allNames = [...new Set([...STATE.officers, ...STATE.technicians])];
  allNames.forEach(name => {
    if (!STATE.users[name]) {
      STATE.users[name] = {
        name,
        photoURL: '',
        accessories: [],
        bgColor: generateRandomColor(),
        textColor: '#fff',
        outlineColor: 'rgba(0,191,255,0.4)',
        stats: {}
      };
    }
  });
}
export function saveData() {
  localStorage.setItem(getStorageKey(CONFIG.STORAGE_KEYS.DUTIES), JSON.stringify(STATE.duties));
  localStorage.setItem(getStorageKey(CONFIG.STORAGE_KEYS.TECH_DUTIES), JSON.stringify(STATE.techDuties));
  localStorage.setItem(getStorageKey(CONFIG.STORAGE_KEYS.GENERAL_SCHEDULE), JSON.stringify(STATE.generalSchedule));
  localStorage.setItem(getStorageKey(CONFIG.STORAGE_KEYS.OFFICERS), JSON.stringify(STATE.officers));
  localStorage.setItem(getStorageKey(CONFIG.STORAGE_KEYS.TECHNICIANS), JSON.stringify(STATE.technicians));
  localStorage.setItem(getStorageKey(CONFIG.STORAGE_KEYS.USERS), JSON.stringify(STATE.users));
  STATE.hasUnsavedChanges = false;
}

// --- Управление месяцем/годом ---
export function changeMonth(newMonth) {
  if (STATE.hasUnsavedChanges) return false;
  STATE.currentMonth = Number(newMonth);
  loadData();
  return true;
}
export function changeYear(newYear) {
  if (STATE.hasUnsavedChanges) return false;
  STATE.year = Number(newYear);
  loadData();
  return true;
}

// --- Управление режимом редактирования ---
export function toggleEditMode() {
  if (!isBossOrAdmin()) return false;
  if (STATE.isEditMode && STATE.hasUnsavedChanges) saveData();
  STATE.isEditMode = !STATE.isEditMode;
  return STATE.isEditMode;
}

// --- Управление сменами и назначениями ---
/**
 * Назначить дежурного на день (с валидацией и синхронизацией)
 */
export function assignDuty(day, name) {
  if (!isBossOrAdmin()) return { error: 'Нет прав' };
  if (!name || !personExists(name)) return { error: 'Сотрудник не найден' };
  const month = STATE.currentMonth;
  if (!STATE.duties[month]) STATE.duties[month] = {};
  STATE.duties[month][day] = name;
  propagateAssignmentChange('duty', day, name, 'ДС');
  STATE.hasUnsavedChanges = true;
  return { success: true };
}

/**
 * Добавить назначение (техник/общий)
 */
export function addAssignment(day, person, shift, calendarType) {
  if (!isBossOrAdmin()) return { error: 'Нет прав' };
  if (!person || !personExists(person)) return { error: 'Сотрудник не найден' };
  if (!shift) return { error: 'Не указана смена' };
  const month = STATE.currentMonth;
  const key = calendarType === 'technician' ? 'techDuties' : 'generalSchedule';
  if (!STATE[key][month]) STATE[key][month] = {};
  if (!STATE[key][month][day]) STATE[key][month][day] = [];
  // Проверка на дубликаты
  if (STATE[key][month][day].some(a => a.person === person && a.shift === shift)) {
    return { error: 'Такое назначение уже есть' };
  }
  STATE[key][month][day].push({ person, shift });
  propagateAssignmentChange(calendarType, day, person, shift);
  STATE.hasUnsavedChanges = true;
  return { success: true };
}

/**
 * Удалить назначение (по индексу)
 */
export function deleteAssignment(day, idx, calendarType) {
  if (!isBossOrAdmin()) return { error: 'Нет прав' };
  const month = STATE.currentMonth;
  const key = calendarType === 'technician' ? 'techDuties' : 'generalSchedule';
  if (!STATE[key][month] || !STATE[key][month][day]) return { error: 'Нет назначений' };
  const arr = STATE[key][month][day];
  if (idx < 0 || idx >= arr.length) return { error: 'Некорректный индекс' };
  const removed = arr.splice(idx, 1)[0];
  propagateAssignmentChange(calendarType, day, removed.person, removed.shift, true);
  STATE.hasUnsavedChanges = true;
  return { success: true };
}

/**
 * Синхронизация между графиками (например, если назначен ДС, убрать из других)
 */
export function propagateAssignmentChange(source, day, person, shift, isDelete = false) {
  const month = STATE.currentMonth;
  // Если назначен ДС, удалить из других графиков
  if (shift === 'ДС' && source === 'duty') {
    // Удалить из techDuties/generalSchedule
    ['techDuties','generalSchedule'].forEach(key => {
      if (STATE[key][month] && STATE[key][month][day]) {
        STATE[key][month][day] = STATE[key][month][day].filter(a => !(a.person === person && a.shift === 'ДС'));
      }
    });
  }
  // Если удалён ДС, ничего не делать
  // Если добавлен/удалён обычный shift, можно добавить/убрать из generalSchedule/techDuties по правилам (расширять по необходимости)
}

// --- Управление персоналом ---
export function addOfficer(name) {
  if (!isAdmin()) return { error: 'Нет прав' };
  if (!name || !CONFIG.NAME_REGEX.test(name)) return { error: 'Некорректный формат имени' };
  if (STATE.officers.includes(name)) return { error: 'Такой сотрудник уже есть' };
  STATE.officers.push(name);
  if (!STATE.users[name]) {
    STATE.users[name] = { name, bgColor: generateRandomColor(), textColor: '#fff', outlineColor: 'rgba(0,191,255,0.4)', accessories: [] };
  }
  saveData();
  return { success: true };
}
export function deleteOfficer(name) {
  if (!isAdmin()) return { error: 'Нет прав' };
  STATE.officers = STATE.officers.filter(o => o !== name);
  STATE.technicians = STATE.technicians.filter(t => t !== name);
  delete STATE.users[name];
  // Удалить из всех назначений
  ['duties','techDuties','generalSchedule'].forEach(key => {
    const obj = STATE[key];
    Object.keys(obj).forEach(monthKey => {
      Object.keys(obj[monthKey]||{}).forEach(dayKey => {
        if (key==='duties') {
          if (obj[monthKey][dayKey] === name) delete obj[monthKey][dayKey];
        } else {
          obj[monthKey][dayKey] = (obj[monthKey][dayKey]||[]).filter(a => a.person !== name);
        }
      });
    });
  });
  saveData();
  return { success: true };
}
export function personExists(name) {
  return STATE.officers.includes(name) || STATE.technicians.includes(name);
}

// --- Статистика ---
export function calculateMonthlyStats(personName, month, year) {
  let totalShifts = 0, totalHours = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayKey = day.toString();
    if (STATE.duties[month]?.[dayKey] === personName) {
      totalShifts++;
      totalHours += CONFIG.SHIFT_HOURS['ДС'] || 0;
    }
    (STATE.techDuties[month]?.[dayKey] || []).forEach(a => {
      if (a.person === personName && a.shift !== 'ДС') {
        totalShifts++;
        totalHours += CONFIG.SHIFT_HOURS[a.shift] || 0;
      }
    });
    (STATE.generalSchedule[month]?.[dayKey] || []).forEach(a => {
      if (a.person === personName) {
        totalShifts++;
        totalHours += CONFIG.SHIFT_HOURS[a.shift] || 0;
      }
    });
  }
  return { shifts: totalShifts, hours: totalHours };
}

// --- Утилиты ---

// --- Интеграция с Telegram WebApp API ---
export function initializeTelegramIntegration(onSaveProfile) {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    // Главная кнопка Telegram
    tg.MainButton.setText('Сохранить изменения');
    tg.MainButton.onClick(onSaveProfile);
    tg.MainButton.show();
    // Тактильная обратная связь
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    // Адаптация к теме Telegram
    if (tg.themeParams) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#fff');
      document.documentElement.style.setProperty('--tg-theme-accent-text-color', tg.themeParams.button_color || '#4a90e2');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#4a90e2');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#fff');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#888');
      document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f5f5f5');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#222');
    }
  }
}
