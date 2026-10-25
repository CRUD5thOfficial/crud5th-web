/* CRUD5th local prototype: contact is information only; no submission. */
(() => {
  const availableRoutes = new Set(['/', '/about', '/works', '/service', '/recruit', '/works/2nd-star-production', '/works/alche-studio', '/works/basica', '/works/master-expo', '/works/opb_app', '/works/research', '/works/miakashi-security', '/works/miakashi-recovery', '/works/noarute', '/works/noascope']);
  const showLocalNotice = () => {
    let notice = document.getElementById('local-research-notice');
    if (!notice) {
      notice = document.createElement('dialog');
      notice.id = 'local-research-notice';
      notice.style.cssText = 'margin:auto;padding:30px;max-width:550px;width:calc(100% - 36px);border:0;border-radius:18px;background:#38e8f1;color:#06151c;font:16px/1.8 sans-serif;z-index:2147483647;pointer-events:auto';
      notice.innerHTML = '<p>次の一歩を、つくろう。<br>こちらはローカルのデザイン試作です。この画面から入力・送信は行いません。</p><button style="margin-top:18px;padding:8px 20px;border:1px solid;border-radius:30px;background:transparent" type="button">閉じて戻る</button>';
      notice.querySelector('button').addEventListener('click', () => notice.close());
      document.body.appendChild(notice);
    }
    notice.showModal();
  };
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const anchor = target.closest('a[href]');
    const contact = target.closest('[data-menu="contact"], [data-contact-submit], button[type="submit"]');
    let shouldBlock = Boolean(contact);
    if (anchor) {
      const destination = new URL(anchor.href, location.href);
      shouldBlock ||= destination.origin !== location.origin || !availableRoutes.has(destination.pathname.replace(/\/$/, '') || '/');
    }
    if (shouldBlock) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLocalNotice();
    }
  }, true);
  document.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    showLocalNotice();
  }, true);
})();
