// src/config.js - Базовые настройки и константы приложения

export const CONFIG = {
  // --- Настройки ролей пользователей ---
  ROLES: {
    // !!! ЗАМЕНИТЕ ЭТИ ID НА РЕАЛЬНЫЕ TELEGRAM ID !!!
    123456789: 'admin',   // Пример ID администратора
    987654321: 'boss',    // Пример ID начальника
    111222333: 'worker',  // Пример ID работяги
    670669284: 'admin',   // Ypy_FF (админ)
    7087677065: 'boss'    // S 1 (начальник, для тестов)
  },
  ROLE_NAMES: { // Отображаемые имена ролей
    'admin': 'Администратор',
    'boss': 'Начальник',
    'worker': 'Работяга',
    'guest': 'Гость' // Роль по умолчанию для неназначенных ID
  },

  // --- Ключи для localStorage ---
  STORAGE_KEYS: {
    DUTIES: 'calendar_duties_v2.5',
    TECH_DUTIES: 'calendar_tech_duties_v2.5',
    GENERAL_SCHEDULE: 'calendar_general_schedule_v2.5',
    OFFICERS: 'calendar_officers_v2.5',
    TECHNICIANS: 'calendar_technicians_v2.5',
    USERS: 'calendar_users_v2.5', // Глобальные профили пользователей
    THEME: 'app_theme', // Тема приложения
    USER_ROLE: 'calendar_user_role', // Роль текущего пользователя
  },

  // --- Названия месяцев ---
  MONTHS: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],

  // --- Типы смен и их продолжительность в часах ---
  SHIFT_TYPES: ["8", "ДС", "День караул", "Ночь караул", "Отсыпной", "Выходной", "Отпуск", "Больничный"],
  SHIFT_HOURS: {
    "8": 8,
    "ДС": 24, // Дежурство суточное
    "День караул": 12,
    "Ночь караул": 12,
    "Отсыпной": 0,
    "Выходной": 0,
    "Отпуск": 0,
    "Больничный": 0
  },

  // --- Прочие константы ---
  NO_DUTY_LABEL: "Нет дежурства",
  NAME_REGEX: /^[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.([А-ЯЁ]\.)?$/, // Пример: Фамилия И.О. или Фамилия И.О.

  // --- Начальные данные для приложения (при первом запуске) ---
  INITIAL_DATA: {
    officers: ["Морозов В.А.", "Ребраков Т.В.", "Костырин С.С.", "Бонадыков В.В.", "Бурлаков М.Ю.", "Артемьев А.М.", "Мефед И.С."],
    technicians: ["Ребраков Т.В.", "Морозов В.А.", "Кузавлев П.С.", "Лебедев А.В.", "Денщиков А.А."],
    julyDuties: { "1": "Ребраков Т.В.", "2": "Костырин С.С.", "3": "Морозов В.А.", "4": "Ребраков Т.В.", "6": "Костырин С.С.", "7": "Костырин С.С.", "8": "Ребраков Т.В.", "9": "Морозов В.А.", "10": "Морозов В.А.", "11": "Костырин С.С.", "12": "Ребраков Т.В.", "13": "Морозов В.А.", "14": "Костырин С.С.", "15": "Ребраков Т.В.", "16": "Морозов В.А.", "17": "Ребраков Т.В.", "18": "Ребраков Т.В.", "19": "Костырин С.С.", "20": "Морозов В.А.", "21": "Костырин С.С.", "22": "Ребраков Т.В.", "23": "Морозов В.А.", "24": "Костырин С.С.", "25": "Ребраков Т.В.", "26": "Морозов В.А.", "27": "Костырин С.С.", "28": "Костырин С.С.", "29": "Морозов В.А.", "30": "Костырин С.С.", "31": "Ребраков Т.В." },
  },

  // --- SVG-иконки для аксессуаров аватаров ---
  ACCESSORY_ICONS: {
    crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10l2-6h10l2 6M2 10h20M6 14l-2 8h16l-2-8M12 2v2M9 5l1 1M15 5l-1 1"/></svg>`,
    tie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="navy" stroke="white" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L9 9h6l-3 7L7 22l5-3 5 3-3-6 3-7h-6z"/></svg>`,
    horns: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="brown" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c-1.1 0-2 .9-2 2s.9 2 2 2h.5c.3 0 .6-.1.8-.4l.7-.7c.3-.3.8-.4 1.2-.2l.6.3c.4.2.9.2 1.3 0l.6-.3c.4-.2.9-.1 1.2.2l.7.7c.2.2.5.4.8.4H20c1.1 0 2-.9 2-2s-.9-2-2-2h-1.5c-.3 0-.6.1-.8.4l-.7.7c-.3.3-.8.4-1.2.2l-.6-.3c-.4-.2-.9-.2-1.3 0l-.6.3c-.4.2-.9-.1 1.2-.2l-.7-.7c-.2-.2-.5-.4-.8-.4H4zM4 12V6c0-1.1.9-2 2-2h.5c.3 0 .6.1.8.4l.7.7c.3.3.8.4 1.2.2l.6-.3c.4-.2.9-.2 1.3 0l.6.3c.4.2.9.1 1.2-.2l-.7-.7c-.2-.2-.5-.4-.8-.4H20c1.1 0 2 .9 2 2v6"/></svg>`,
    medal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="silver" stroke="black" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4v8l4 4M12 4l-4 4"/></svg>`,
    halo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" stroke="orange" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="5"/><path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10A10 10 0 0 0 12 2z" fill="none"/></svg>`,
    glow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="yellow" stroke="orange" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="yellow" opacity="0.5"/><path d="M12 2v20M2 12h20M4.9 4.9l14.1 14.1M4.9 19.1l14.1-14.1" stroke="orange" stroke-opacity="0.8"/></svg>`
  }
};
