// Точка входа приложения
import { initService } from './service.js';
import { initView } from './view.js';
import { initController } from './controller.js';
import './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  initService();
  initView();
  initController();
});
