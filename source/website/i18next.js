import i18next from 'i18next';
import { CookieGetStringVal } from './cookiehandler.js';
import { HashHandler } from './hashhandler.js';
import zhCN from './locale/zh-CN.json' assert { type: 'json' };

const hashHandler = new HashHandler();

const defaultLang =
  typeof navigator !== 'undefined'
    ? hashHandler.GetLocaleFromHash() ||
      CookieGetStringVal('ov_language', navigator.language)
    : '';

i18next.init({
  lng: defaultLang, // if you're u  sing a language detector, do not define the lng option
  debug: false,
  supportedLngs: ['zh-CN'],
  resources: {
    'zh-CN': { translation: zhCN },
  },
});

const t = i18next.t;

export { i18next, t };

if (typeof document !== 'undefined') {
  // translate HTML
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-i18n]').forEach((ele) => {
      const translateKey = ele.getAttribute('data-i18n') || ele.textContent;
      ele.textContent = t(translateKey);
    });
  });
}
