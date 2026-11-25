/*
 * バックアップ診断の画面。
 * 回答はこのページの中だけで扱う。送信も保存もしない。
 */
(function () {
  'use strict';

  var Core = window.DiagnosisCore;
  if (!Core) return;

  var EXCLUSIVE_PLACES = ['none', 'unknown'];
  var LEVEL_ORDER = ['weak', 'middle', 'strong'];

  var missingBox = document.getElementById('missing');
  var showButton = document.getElementById('show-result');
  var printButton = document.getElementById('print-result');
  var resultSection = document.getElementById('result');
  var resultTitle = document.getElementById('result-title');
  var resultShown = false;

  function inputsOf(questionId) {
    return Array.prototype.slice.call(document.querySelectorAll('input[name="' + questionId + '"]'));
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function readAnswers() {
    var answers = {};
    Core.QUESTIONS.forEach(function (question) {
      var checked = inputsOf(question.id)
        .filter(function (input) { return input.checked; })
        .map(function (input) { return input.value; });
      if (question.type === 'multi') {
        answers[question.id] = checked;
      } else if (checked.length > 0) {
        answers[question.id] = checked[0];
      }
    });
    return answers;
  }

  /* 問1の「取っていない」「分からない」は、ほかの答えと一緒に選べない。 */
  function keepPlacesConsistent(changed) {
    if (!changed || changed.name !== 'q1' || !changed.checked) return;
    var changedIsExclusive = EXCLUSIVE_PLACES.indexOf(changed.value) !== -1;
    inputsOf('q1').forEach(function (input) {
      if (input === changed) return;
      var isExclusive = EXCLUSIVE_PLACES.indexOf(input.value) !== -1;
      if (changedIsExclusive || isExclusive) input.checked = false;
    });
  }

  /* 写しを取っていないときに答えようのない問を、選べない状態にする。 */
  function updateSkippedQuestions(answers) {
    var required = Core.requiredQuestionIds(answers);
    Core.QUESTIONS.forEach(function (question) {
      var fieldset = document.getElementById(question.id);
      var note = fieldset.querySelector('.skip-note');
      var skipped = required.indexOf(question.id) === -1;
      fieldset.disabled = skipped;
      fieldset.classList.toggle('is-skipped', skipped);
      if (note) note.hidden = !skipped;
    });
  }

  function updateMissing(answers) {
    var unanswered = Core.findProblems(answers);
    clear(missingBox);
    showButton.disabled = unanswered.length > 0;
    Core.QUESTIONS.forEach(function (question) {
      var isMissing = unanswered.some(function (problem) { return problem.questionId === question.id; });
      document.getElementById(question.id).classList.toggle('is-unanswered', isMissing);
    });
    if (unanswered.length === 0) {
      missingBox.appendChild(document.createTextNode('すべての問に答えました。'));
      return;
    }
    missingBox.appendChild(document.createTextNode('まだ答えていない問: '));
    unanswered.forEach(function (problem, index) {
      if (index > 0) missingBox.appendChild(document.createTextNode('、'));
      var link = el('a', null, '問' + problem.number);
      link.href = '#' + problem.questionId;
      missingBox.appendChild(link);
    });
  }

  function hideResult() {
    if (!resultShown) return;
    resultShown = false;
    resultSection.hidden = true;
    document.body.classList.remove('has-result');
  }

  function refresh(changed) {
    keepPlacesConsistent(changed);
    var answers = readAnswers();
    updateSkippedQuestions(answers);
    updateMissing(answers);
    if (changed && resultShown) {
      hideResult();
      missingBox.appendChild(document.createTextNode(' 回答が変わりました。もう一度「結果を見る」を押してください。'));
    }
  }

  function list(items, className) {
    var ul = el('ul', className || 'plain-list');
    items.forEach(function (item) { ul.appendChild(el('li', null, item)); });
    return ul;
  }

  function renderLevel(container, judgement, levels) {
    clear(container);
    var scale = el('ol', 'scale');
    LEVEL_ORDER.forEach(function (level) {
      var item = el('li', 'scale-item');
      item.appendChild(el('span', 'scale-name', levels[level].stage));
      if (level === judgement.level) {
        item.classList.add('is-current');
        item.setAttribute('aria-current', 'true');
        item.appendChild(el('span', 'scale-mark', '今回の結果'));
      }
      scale.appendChild(item);
    });
    container.appendChild(scale);
    container.appendChild(el('p', 'verdict', judgement.label + '。'));
    if (judgement.reason) container.appendChild(el('p', 'verdict-reason', judgement.reason));

    if (judgement.holds.length > 0) {
      container.appendChild(el('h4', null, '効いている点'));
      container.appendChild(list(judgement.holds));
    }
    if (judgement.gaps.length > 0) {
      container.appendChild(el('h4', null, '足りない点'));
      container.appendChild(list(judgement.gaps));
    }
    if (judgement.improvements && judgement.improvements.length > 0) {
      container.appendChild(el('h4', null, 'さらに良くするなら'));
      container.appendChild(list(judgement.improvements));
    }
    if (judgement.unknownNote) container.appendChild(el('p', 'note', judgement.unknownNote));
    if (judgement.dependsNote) container.appendChild(el('p', 'note', judgement.dependsNote));
  }

  function renderFindings(container, findings) {
    clear(container);
    if (findings.length === 0) {
      container.appendChild(el('p', null, 'お答えの範囲では、確認事項は見つかりませんでした。お答えが実際の設定と合っているかを、保存先の設定画面で確かめておくと確実です。'));
      return;
    }
    container.appendChild(el('p', 'block-lead', '上から順に直すことをお勧めします。写しを消されにくくすることが先、戻せることの確認がその次です。'));
    var ol = el('ol', 'findings');
    findings.forEach(function (finding) {
      var item = el('li', 'finding');
      var meta = finding.order + '　' + finding.areaLabel + '（問' + finding.questionNumber + '）' +
        (finding.unknown ? '　まず確かめる' : '');
      item.appendChild(el('p', 'finding-meta', meta));
      item.appendChild(el('h4', 'finding-title', finding.title));
      var details = el('dl', 'finding-details');
      details.appendChild(el('dt', null, 'なぜ問題になるか'));
      details.appendChild(el('dd', null, finding.why));
      details.appendChild(el('dt', null, '直すなら'));
      details.appendChild(el('dd', null, finding.fix));
      item.appendChild(details);
      ol.appendChild(item);
    });
    container.appendChild(ol);
  }

  function cell(tag, label, text, className) {
    var node = el(tag, className, text);
    node.setAttribute('data-label', label);
    return node;
  }

  function renderCriteria(container, criteria) {
    clear(container);
    var table = el('table', 'criteria-table');
    var head = el('thead');
    var headRow = el('tr');
    ['評価基準', '原文', 'いまの回答で示せる材料', '補足'].forEach(function (title) {
      var th = el('th', null, title);
      th.scope = 'col';
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = el('tbody');
    criteria.forEach(function (criterion) {
      var row = el('tr');
      var questions = criterion.questions.map(function (number) { return '問' + number; }).join('・');
      var idCell = cell('th', '評価基準', criterion.id + '（' + criterion.stage + '）', 'criteria-id');
      idCell.scope = 'row';
      idCell.appendChild(el('span', 'criteria-questions', questions));
      row.appendChild(idCell);
      row.appendChild(cell('td', '原文', criterion.text));
      row.appendChild(cell('td', 'いまの回答で示せる材料', criterion.statusLabel, 'criteria-status is-' + criterion.status));
      row.appendChild(cell('td', '補足', criterion.note));
      body.appendChild(row);
    });
    table.appendChild(body);
    container.appendChild(table);
  }

  function renderAnswers(container, answers) {
    clear(container);
    var dl = el('dl', 'answers');
    answers.forEach(function (answer) {
      var row = el('div', 'answer-row');
      row.appendChild(el('dt', null, '問' + answer.number + '　' + answer.text));
      var text = answer.skipped ? '（写しを取っていないため、答えていません）' : answer.answers.join('／');
      row.appendChild(el('dd', null, text));
      dl.appendChild(row);
    });
    container.appendChild(dl);
  }

  function todayText() {
    var now = new Date();
    return '診断日: ' + now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
  }

  function showResult() {
    var result = Core.diagnose(readAnswers());
    if (!result.ok) {
      refresh(null);
      return;
    }
    document.getElementById('result-date').textContent = todayText();
    renderLevel(document.getElementById('deletion-body'), result.deletion, Core.DELETION_LEVELS);
    renderLevel(document.getElementById('restore-body'), result.restore, Core.RESTORE_LEVELS);
    renderFindings(document.getElementById('findings-body'), result.findings);
    renderCriteria(document.getElementById('criteria-body'), result.criteria);
    renderAnswers(document.getElementById('answers-body'), result.answers);
    resultSection.hidden = false;
    resultShown = true;
    document.body.classList.add('has-result');
    updateMissing(readAnswers());
    resultTitle.focus();
    resultSection.scrollIntoView();
  }

  /* 再読み込みのあとにブラウザが前の選択を戻すことがあるので、開いたときは必ず空にする。 */
  function resetInputs() {
    Core.QUESTIONS.forEach(function (question) {
      inputsOf(question.id).forEach(function (input) { input.checked = false; });
    });
  }

  document.getElementById('questions').addEventListener('change', function (event) {
    var target = event.target;
    if (target && target.tagName === 'INPUT') refresh(target);
  });
  showButton.addEventListener('click', showResult);
  printButton.addEventListener('click', function () { window.print(); });
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    resetInputs();
    hideResult();
    refresh(null);
  });

  resetInputs();
  refresh(null);
})();
