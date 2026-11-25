/*
 * バックアップ診断の判定。
 * 画面にも保存にも通信にも触れない純粋な関数だけを置く。
 * ブラウザでは window.DiagnosisCore、Node では require / import で読める。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DiagnosisCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var QUESTIONS = [
    {
      id: 'q1', number: 1, type: 'multi',
      text: '写しはどこにありますか（複数選択）',
      options: [
        { value: 'same', label: '元のデータと同じサーバーやパソコンの中' },
        { value: 'nas', label: '社内のNAS・外付けHDD（つないだまま）' },
        { value: 'removable', label: '取り外して保管している媒体' },
        { value: 'offsite', label: 'クラウドなど社外' },
        { value: 'none', label: '取っていない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q2', number: 2, type: 'single',
      text: '写しの保存先を消せるアカウントは、普段の仕事で使う管理者アカウントと同じですか',
      options: [
        { value: 'same', label: '同じ' },
        { value: 'shared', label: '別だが、パスワードの保管場所や管理者が同じ' },
        { value: 'mfa', label: '別で、追加の認証（多要素認証）もある' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q3', number: 3, type: 'single',
      text: '保存先は、社内のネットワークからいつも見えていますか（共有フォルダとして開ける、など）',
      options: [
        { value: 'always', label: 'いつも見える' },
        { value: 'onsave', label: '保存するときだけつながる' },
        { value: 'hidden', label: '社内からは見えない（社外で受け取るだけ、または取り外して保管）' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q4', number: 4, type: 'single',
      text: '一定の期間、誰にも消せない・書き換えられない設定がありますか',
      options: [
        { value: 'locked', label: 'ある（期間も分かる）' },
        { value: 'versions', label: '過去の版は残るが、管理者なら消せる' },
        { value: 'none', label: 'ない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q5', number: 5, type: 'single',
      text: '最後に、写しからファイルを実際に取り出して確かめたのはいつですか',
      options: [
        { value: 'half', label: '半年以内' },
        { value: 'year', label: '半年〜1年前' },
        { value: 'older', label: '1年より前' },
        { value: 'never', label: '一度もない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q6', number: 6, type: 'single',
      text: '取り出しの手順書はありますか',
      options: [
        { value: 'full', label: '対象ごとにあり、更新日も分かる' },
        { value: 'stale', label: 'あるが古い、または担当者の頭の中' },
        { value: 'none', label: 'ない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q7', number: 7, type: 'single',
      text: '何を、どの頻度で、いつまで残すかを決めた文書はありますか',
      options: [
        { value: 'documented', label: 'ある' },
        { value: 'settings', label: '設定はしてあるが、文書はない' },
        { value: 'none', label: 'ない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q8', number: 8, type: 'single',
      text: '保存の失敗に気づく仕組みはありますか',
      options: [
        { value: 'watched', label: '毎日、結果を見る人がいる・通知を確認している' },
        { value: 'ignored', label: '通知は来るが見ていない' },
        { value: 'none', label: 'ない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q9', number: 9, type: 'single',
      text: '止まると困る仕事と、いつまでに戻したいかを決めていますか',
      options: [
        { value: 'documented', label: '決めて文書にしている' },
        { value: 'informal', label: '決めているが頭の中' },
        { value: 'none', label: '決めていない' },
        { value: 'unknown', label: '分からない' }
      ]
    },
    {
      id: 'q10', number: 10, type: 'single',
      text: '事故のとき、最初に誰へ連絡し、誰が戻すかを決めていますか',
      options: [
        { value: 'shared', label: '決めて、連絡先も共有している' },
        { value: 'vendor', label: '保守会社に任せているが、取り決めはない' },
        { value: 'none', label: '決めていない' },
        { value: 'unknown', label: '分からない' }
      ]
    }
  ];

  /* 写しを取っていないときは、保存先や取り出しについての問は答えようがないので求めない。 */
  var SKIPPED_WITHOUT_BACKUP = ['q2', 'q3', 'q4', 'q5', 'q6', 'q8'];

  var CRITERIA = [
    {
      id: '4-3-4-1', stage: '★3', questions: [1, 7],
      text: '取得対象、取得頻度及び保管期間を定めて自社で取り扱うデータのバックアップを取得すること。'
    },
    {
      id: '4-3-4-2', stage: '★3', questions: [1],
      text: '重要な機密情報については、No.4-3-4-1におけるバックアップに加えて、遠隔地バックアップを実施すること。'
    },
    {
      id: '4-3-4-3', stage: '★3', questions: [1, 6],
      text: 'バックアップ対象ごとにリストア手順書を整備すること。'
    },
    {
      id: '7-1-1-1', stage: '★3', questions: [1, 9, 10],
      text: '事業継続上重要なシステムについて、サイバー攻撃を念頭に、業務の目標復旧レベルを定めたうえで、当該レベルまで業務を回復するために必要な対策を、以下の例を参考として整備すること。…（抜粋。続く例の一覧は省略）'
    },
    {
      id: '7-1-1-2', stage: '★4', questions: [1, 5, 6, 9],
      text: '（抜粋）…No.4-3-4-3で定めたリストア手順書どおりに、かつ、目標復旧時間内でバックアップの復元ができることを確認すること。'
    }
  ];

  var DELETION_LEVELS = {
    weak: { stage: '消されやすい', label: '管理者の権限を取られると、追加の手間なしに写しまで消せる構成です' },
    middle: { stage: '一手間かかる', label: '写しを消すには、管理者の権限のほかに、もう一つ守りを破る必要がある構成です' },
    strong: { stage: '消されにくい', label: 'お答えのとおりなら、仕事場の権限だけでは消せない構成です' }
  };

  var RESTORE_LEVELS = {
    weak: { stage: '確かめられていない', label: 'いまの写しから戻せるかどうかは、確かめられていません' },
    middle: { stage: '一部は確かめている', label: '取り出せたことはありますが、確かめた時期・手順書・日々の確認のどれかに不足があります' },
    strong: { stage: '確かめている', label: '取り出せることを半年以内に確かめており、手順書と日々の確認もそろっています' }
  };

  /* 写しを取っていないときは、消す・戻すの前に、写しそのものが無いことを見出しにする。 */
  var NO_BACKUP = {
    deletionLabel: '写しがありません。元のデータを失うと、戻す元がありません',
    deletionReason: '攻撃者は、写しを探して消す手間さえ要りません。元のデータを消すか暗号化するだけで、仕事を止められます。',
    restoreLabel: '戻す元になる写しがありません',
    restoreReason: '取り出しの確認や手順書は、写しを取り始めてからの話になります。'
  };

  var STATUS_LABELS = { available: '示せる材料があります', partial: '材料の一部があります', lacking: '不足しています' };

  var AREA_LABELS = { deletion: '消されにくさ', restore: '戻せるか', agreement: '取り決め', extra: 'さらに良くするなら' };

  /* 確認事項。並びが、そのまま直す順番になる（消されにくさ → 戻せるか → 取り決め）。 */
  var FINDING_TEXTS = {
    'q1-none': {
      area: 'deletion', number: 1,
      title: '写しを取っていません',
      why: '元のデータを消されたり暗号化されたりすると、戻す元がありません。攻撃者は、写しを探して消す手間さえ要りません。',
      fix: '止まると困る仕事のデータを1つ決め、仕事場とは別の場所へ写しを取り始めます。'
    },
    'q1-unknown': {
      area: 'deletion', number: 1, unknown: true,
      title: '写しがどこにあるか、分かっていません',
      why: '場所が分からなければ、攻撃者に消されていても気づけず、事故のときに取りに行くこともできません。',
      fix: '保守会社か担当者に、写しの保存先をすべて書き出してもらいます。'
    },
    'q1-same-only': {
      area: 'deletion', number: 1,
      title: '写しが、元のデータと同じ機器の中にしかありません',
      why: 'その機器に入った攻撃者は、元のデータと写しを同じ操作でまとめて消すか、暗号化できます。機器の故障でも両方を失います。',
      fix: '社外、または取り外して保管する媒体に、もう1つ写しを置きます。'
    },
    'q1-onsite-only': {
      area: 'deletion', number: 1,
      title: '写しがすべて、社内でつながったままの機器にあります',
      why: '社内のネットワークに入った攻撃者は、つながっている保存先を順に探し、写しも一緒に暗号化することが多くあります。',
      fix: '社外、または取り外して保管する媒体に、もう1つ写しを置きます。'
    },
    'q2-same': {
      area: 'deletion', number: 2,
      title: '写しの保存先を消せるアカウントが、普段の管理者アカウントと同じです',
      why: '攻撃者が仕事場の管理者アカウントを1つ手に入れると、消せない設定で守られていない写しは、そのまま消せます。',
      fix: '保存先を消せるアカウントを普段の管理者と分け、多要素認証をかけます。パスワードの保管場所も別にします。'
    },
    'q2-shared': {
      area: 'deletion', number: 2,
      title: 'アカウントは別ですが、パスワードの保管場所か管理者が同じです',
      why: '攻撃者は、管理者のパソコンやパスワードの保管場所に入れば、別のアカウントの情報もまとめて手に入れられます。',
      fix: '保存先のアカウントに多要素認証をかけ、パスワードを普段とは別の場所で保管します。'
    },
    'q2-unknown': {
      area: 'deletion', number: 2, unknown: true,
      title: '保存先を消せるアカウントがどれか、分かっていません',
      why: '普段の管理者アカウントで消せる状態なら、そのアカウントを手に入れた攻撃者が写しまで消せます。分からないうちは、そうなっているものとして備えます。',
      fix: '保存先の管理画面で、削除の権限を持つアカウントを一覧にして確かめます。'
    },
    'q4-none': {
      area: 'deletion', number: 4,
      title: '一定の期間、誰にも消せない設定がありません',
      why: '権限を手に入れた攻撃者は、写しをその場で消すか、中身を書き換えられます。',
      fix: '保存先に、決めた期間は消せない・書き換えられない設定があるかを確かめ、あれば有効にします。なければ、その設定ができる保存先を1つ足します。'
    },
    'q4-versions': {
      area: 'deletion', number: 4,
      title: '過去の版は残りますが、管理者なら消せます',
      why: 'うっかりの上書きには役立ちますが、管理者の権限を手に入れた攻撃者は、過去の版ごと消せます。',
      fix: '決めた期間は管理者にも消せない設定に切り替えます。'
    },
    'q4-unknown': {
      area: 'deletion', number: 4, unknown: true,
      title: '消せない・書き換えられない設定があるか、分かっていません',
      why: '設定がなければ、権限を手に入れた攻撃者は写しをその場で消せます。分からないうちは、設定がないものとして備えます。',
      fix: '保存先の設定画面で、消せない期間の設定の有無と、その期間を確かめます。'
    },
    'q3-always': {
      area: 'deletion', number: 3,
      title: '保存先が、社内のネットワークからいつも見えています',
      why: '社内に入った攻撃者は、共有フォルダとして開ける保存先をほかのファイルと同じように見つけ、暗号化の対象にします。',
      fix: '社内からは開けず、社外で受け取るだけの形にできるかを確かめます。難しければ、保存するときだけつなぐ形にします。'
    },
    'q3-onsave': {
      area: 'deletion', number: 3,
      title: '保存するときは、保存先が社内からつながります',
      why: 'つながる時間は短くなりますが、その間は、社内に潜んだ攻撃者からも保存先に手が届きます。',
      fix: '社内からは開けず、社外で受け取るだけの形にできるかを確かめます。'
    },
    'q3-unknown': {
      area: 'deletion', number: 3, unknown: true,
      title: '保存先が社内から見えているか、分かっていません',
      why: '共有フォルダとして見えていれば、社内に入った攻撃者がほかのファイルと同じように暗号化できます。分からないうちは、見えているものとして備えます。',
      fix: '社内のパソコンから保存先を開けるかどうかを、保守会社か担当者に確かめます。'
    },
    /* 最も強い段階のときに残る問3。判定とは食い違わない、任意の改善として出す。 */
    'q3-always-extra': {
      area: 'extra', number: 3,
      title: '保存先を、社内のネットワークから見えない置き方にする余地があります',
      why: 'お答えのとおりなら、別のアカウントと消せない期間の設定が効いていて、写しは守られています。ただ、社内から見えている保存先は、社内に入った攻撃者にとって、設定や認証の弱い所を探す入口になります。',
      fix: '社内からは開けず、社外で受け取るだけの形にできるかを確かめます。'
    },
    'q3-onsave-extra': {
      area: 'extra', number: 3,
      title: '保存するときだけつながる形を、社内から届かない形にする余地があります',
      why: 'お答えのとおりなら、別のアカウントと消せない期間の設定が効いていて、写しは守られています。つながっている間は社内から保存先に届くので、届かない形にできれば、さらに確かになります。',
      fix: '社内からは開けず、社外で受け取るだけの形にできるかを確かめます。'
    },
    'q3-unknown-extra': {
      area: 'extra', number: 3, unknown: true,
      title: '保存先が社内から見えているかを、確かめておくと確実です',
      why: '別のアカウントと消せない期間の設定が効いているため、いまの判定には響いていません。見えている場合は、社内に入った攻撃者にとって、設定や認証の弱い所を探す入口になります。',
      fix: '社内のパソコンから保存先を開けるかどうかを、保守会社か担当者に確かめます。'
    },
    'q5-never': {
      area: 'restore', number: 5,
      title: '写しからファイルを取り出して確かめたことがありません',
      why: '保存が成功と表示されていても、取り出すと開けない、必要なものが入っていない、ということがあります。事故の当日に初めて分かるのでは間に合いません。',
      fix: '代表的なファイルを1つ、別の場所へ取り出して開けるかを確かめ、日付と結果を書き残します。'
    },
    'q5-unknown': {
      area: 'restore', number: 5, unknown: true,
      title: '最後に取り出して確かめた時期が、分かっていません',
      why: '記録がなければ、取り出せることを確かめたとは言えません。事故の当日に初めて試すことになります。',
      fix: '代表的なファイルを1つ、別の場所へ取り出して開けるかを確かめ、日付と結果を書き残します。'
    },
    'q5-older': {
      area: 'restore', number: 5,
      title: '最後に取り出して確かめてから、1年より長くたっています',
      why: 'その間に、機器、設定、担当者が変わっていることがあります。以前に取り出せたことは、いま取り出せることの裏づけになりません。',
      fix: '近いうちに取り出して確かめ、以後は半年に1回を目安に日を決めます。'
    },
    'q5-year': {
      area: 'restore', number: 5,
      title: '最後の取り出し確認から、半年以上たっています',
      why: '確かめてからの期間が長いほど、その後の設定の変更や保存の抜けに気づけていない恐れが大きくなります。',
      fix: '半年に1回を目安に、取り出して確かめる日を決めます。'
    },
    'q6-stale': {
      area: 'restore', number: 6,
      title: '取り出しの手順が古いか、担当者の頭の中にあります',
      why: '事故は担当者がいない日にも起きます。攻撃を受けたあとは普段の画面や道具が使えないこともあり、記憶だけでは進められません。',
      fix: '対象ごとに手順を書き出して更新日を入れ、仕事場のサーバーとは別の場所にも置きます。'
    },
    'q6-none': {
      area: 'restore', number: 6,
      title: '取り出しの手順書がありません',
      why: '事故のとき、手順を調べるところから始めることになります。攻撃を受けたあとは、普段の画面や道具が使えないこともあります。',
      fix: '対象ごとに手順を書き出して更新日を入れ、仕事場のサーバーとは別の場所にも置きます。'
    },
    'q6-unknown': {
      area: 'restore', number: 6, unknown: true,
      title: '取り出しの手順書があるか、分かっていません',
      why: 'ある場所を誰も知らない手順書は、事故のときに使えません。',
      fix: '手順書の有無と置き場所を確かめます。なければ、対象ごとに書き出します。'
    },
    'q8-ignored': {
      area: 'restore', number: 8,
      title: '保存の失敗の通知は来ていますが、見ていません',
      why: '保存が何週間も止まっていても気づけません。攻撃者が保存を止めたり設定を変えたりしても、そのまま時間が過ぎます。',
      fix: '結果を見る人と、見る時刻を決めます。失敗の通知だけでなく、通知が来ない日にも気づけるようにします。'
    },
    'q8-none': {
      area: 'restore', number: 8,
      title: '保存の失敗に気づく仕組みがありません',
      why: '保存が止まっていても、事故の日まで誰も気づけません。戻せるのは、最後に成功した日の状態までです。',
      fix: '保存の結果が通知されるように設定し、見る人と見る時刻を決めます。'
    },
    'q8-unknown': {
      area: 'restore', number: 8, unknown: true,
      title: '保存の失敗に気づく仕組みがあるか、分かっていません',
      why: '仕組みがなければ、保存が止まっていても事故の日まで気づけません。',
      fix: '保存の結果が誰に通知され、誰が見ているかを確かめます。'
    },
    'q7-settings': {
      area: 'agreement', number: 7,
      title: '設定はしてありますが、対象・頻度・保管期間を決めた文書がありません',
      why: '何が守られていて、何が守られていないかを、設定した人のほかは答えられません。取引先から聞かれたときに、示せるものもありません。',
      fix: 'いまの設定を書き写し、対象・頻度・保管期間を1枚にまとめます。'
    },
    'q7-none': {
      area: 'agreement', number: 7,
      title: '何を、どの頻度で、いつまで残すかを決めた文書がありません',
      why: '必要なデータが対象から漏れていても気づけません。取引先から聞かれたときに、示せるものもありません。',
      fix: '止まると困る仕事から順に、対象・頻度・保管期間を決めて1枚にまとめます。'
    },
    'q7-unknown': {
      area: 'agreement', number: 7, unknown: true,
      title: '対象・頻度・保管期間を決めた文書があるか、分かっていません',
      why: '文書がなければ、必要なデータが対象から漏れていても気づけません。',
      fix: '文書の有無を確かめます。なければ、いまの設定を書き写して1枚にまとめます。'
    },
    'q9-informal': {
      area: 'agreement', number: 9,
      title: '止まると困る仕事と戻したい期限が、文書になっていません',
      why: '決めた人がいない日に事故が起きると、どれから戻すかをその場で話し合うことになります。',
      fix: '止まると困る仕事と、いつまでに戻したいかを、短くてよいので書き出します。'
    },
    'q9-none': {
      area: 'agreement', number: 9,
      title: '止まると困る仕事と、いつまでに戻したいかを決めていません',
      why: 'どのデータを、どの頻度で残せば足りるのかを決める基準がありません。事故のときは、戻す順番から話し合うことになります。',
      fix: '止まると困る仕事を3つまで挙げ、それぞれいつまでに戻したいかを決めて書き出します。'
    },
    'q9-unknown': {
      area: 'agreement', number: 9, unknown: true,
      title: '止まると困る仕事と戻したい期限が決まっているか、分かっていません',
      why: '決まっていても、知っている人がいない日に事故が起きると、どれから戻すかをその場で話し合うことになります。',
      fix: '経営者か責任者に確かめ、止まると困る仕事と、いつまでに戻したいかを書き出します。'
    },
    'q10-vendor': {
      area: 'agreement', number: 10,
      title: '保守会社に任せていますが、取り決めがありません',
      why: '誰が、どこまで、いつまでに動くかが決まっていないと、事故の当日に確認から始めることになります。',
      fix: '保守会社と、最初の連絡先、戻す作業の担当、対応できる時間帯を書面で確かめます。'
    },
    'q10-none': {
      area: 'agreement', number: 10,
      title: '事故のとき、誰へ連絡し、誰が戻すかを決めていません',
      why: '事故に気づいた人が、連絡先を探すところから始めることになります。その間も被害は広がります。',
      fix: '最初の連絡先と、戻す作業の担当を決め、連絡先を紙でも共有します。'
    },
    'q10-unknown': {
      area: 'agreement', number: 10, unknown: true,
      title: '事故のときの連絡先と、戻す作業の担当が決まっているか、分かっていません',
      why: '知っている人がいない日に事故が起きると、連絡先を探すところから始めることになります。',
      fix: '社内と保守会社に確かめ、最初の連絡先と戻す作業の担当を書き出して、紙でも共有します。'
    }
  };

  var FINDING_ORDER = [
    'q1-none', 'q1-unknown', 'q1-same-only', 'q1-onsite-only',
    'q2-same', 'q2-shared', 'q2-unknown',
    'q4-none', 'q4-versions', 'q4-unknown',
    'q3-always', 'q3-onsave', 'q3-unknown',
    'q5-never', 'q5-unknown', 'q5-older', 'q5-year',
    'q6-stale', 'q6-none', 'q6-unknown',
    'q8-ignored', 'q8-none', 'q8-unknown',
    'q7-settings', 'q7-none', 'q7-unknown',
    'q9-informal', 'q9-none', 'q9-unknown',
    'q10-vendor', 'q10-none', 'q10-unknown',
    'q3-always-extra', 'q3-onsave-extra', 'q3-unknown-extra'
  ];

  function questionById(id) {
    for (var i = 0; i < QUESTIONS.length; i += 1) {
      if (QUESTIONS[i].id === id) return QUESTIONS[i];
    }
    return null;
  }

  function hasOption(question, value) {
    return question.options.some(function (option) { return option.value === value; });
  }

  function optionLabel(question, value) {
    for (var i = 0; i < question.options.length; i += 1) {
      if (question.options[i].value === value) return question.options[i].label;
    }
    return '';
  }

  /* 問1の回答を、質問の並び順の配列にそろえる（選んだ順番で結果が変わらないように）。 */
  function normalizePlaces(raw) {
    if (!Array.isArray(raw)) return [];
    var question = questionById('q1');
    return question.options
      .map(function (option) { return option.value; })
      .filter(function (value) { return raw.indexOf(value) !== -1; });
  }

  function hasNoBackup(answers) {
    var places = normalizePlaces(answers && answers.q1);
    return places.length === 1 && places[0] === 'none';
  }

  /* いまの回答で、答えが必要な問のid。 */
  function requiredQuestionIds(answers) {
    var skip = hasNoBackup(answers) ? SKIPPED_WITHOUT_BACKUP : [];
    return QUESTIONS
      .map(function (question) { return question.id; })
      .filter(function (id) { return skip.indexOf(id) === -1; });
  }

  /* 判定できない理由の一覧。空なら判定できる。 */
  function findProblems(answers) {
    var source = answers || {};
    var required = requiredQuestionIds(source);
    var problems = [];
    QUESTIONS.forEach(function (question) {
      if (required.indexOf(question.id) === -1) return;
      var raw = source[question.id];
      if (question.type === 'multi') {
        var list = Array.isArray(raw) ? raw : [];
        if (list.length === 0) {
          problems.push({ questionId: question.id, number: question.number, reason: 'unanswered' });
          return;
        }
        if (!list.every(function (value) { return hasOption(question, value); })) {
          problems.push({ questionId: question.id, number: question.number, reason: 'invalid' });
          return;
        }
        var exclusive = list.indexOf('none') !== -1 || list.indexOf('unknown') !== -1;
        if (exclusive && normalizePlaces(list).length > 1) {
          problems.push({ questionId: question.id, number: question.number, reason: 'conflict' });
        }
        return;
      }
      if (raw === undefined || raw === null || raw === '') {
        problems.push({ questionId: question.id, number: question.number, reason: 'unanswered' });
        return;
      }
      if (typeof raw !== 'string' || !hasOption(question, raw)) {
        problems.push({ questionId: question.id, number: question.number, reason: 'invalid' });
      }
    });
    return problems;
  }

  function unknownNote(numbers, treatedAs) {
    if (numbers.length === 0) return null;
    var names = numbers.map(function (number) { return '問' + number; }).join('・');
    return '「分からない」と答えた' + names + 'は、' + treatedAs +
      'ものとして扱いました。確かめた結果によっては、判定が変わります。';
  }

  /* gaps と improvements は、確認事項が決まったあとに diagnose が入れる。 */
  function deletionResult(level, reason, holds, unknownNumbers) {
    return {
      level: level,
      stage: DELETION_LEVELS[level].stage,
      label: DELETION_LEVELS[level].label,
      reason: reason,
      holds: holds,
      gaps: [],
      improvements: [],
      unknownQuestions: unknownNumbers,
      unknownNote: unknownNote(unknownNumbers, '守りがない')
    };
  }

  /* A. 消されにくさ（問1〜4）。「分からない」は弱い側の答えと同じに扱う。 */
  function judgeDeletion(a) {
    var places = a.q1;
    if (a.noBackup) {
      var none = deletionResult('weak', NO_BACKUP.deletionReason, [], []);
      none.label = NO_BACKUP.deletionLabel;
      return none;
    }
    var unknownNumbers = [];
    if (a.q2 === 'unknown') unknownNumbers.push(2);
    if (a.q3 === 'unknown') unknownNumbers.push(3);
    if (a.q4 === 'unknown') unknownNumbers.push(4);

    if (places.indexOf('unknown') !== -1) {
      var unknownPlace = deletionResult('weak', '写しがどこにあるか分かっていないため、守られているとは見なせません。', [], [1].concat(unknownNumbers));
      unknownPlace.label = '写しの場所が分からないため、守られているかを判断できません';
      return unknownPlace;
    }

    var hasSeparate = places.indexOf('removable') !== -1 || places.indexOf('offsite') !== -1;
    var separateAccount = a.q2 === 'mfa';
    var locked = a.q4 === 'locked';
    /* つないだままの機器しかないときは、社内から見えないという答えを守りに数えない。 */
    var outOfSight = hasSeparate && a.q3 === 'hidden';

    var holds = [];
    if (hasSeparate) holds.push('社外、または取り外して保管している写しがあります。');
    if (separateAccount) holds.push('保存先を消せるアカウントが普段の管理者と別で、多要素認証もかかっています。');
    if (outOfSight) holds.push('保存先が、社内のネットワークからは見えません。');
    if (locked) holds.push('一定の期間、誰にも消せない・書き換えられない設定があります。');

    /* 同じ機器の中だけの写しは、ほかの守りが効いていても、機器ごと失えば残らない。 */
    if (places.length === 1 && places[0] === 'same') {
      var sameOnly = deletionResult('weak', '写しが元のデータと同じ機器の中にしかなく、その機器に入られると、元のデータと写しを同時に失うおそれがあります。機器の故障でも両方を失います。', holds, unknownNumbers);
      sameOnly.label = '写しが、元のデータと同じ機器の中にしかない構成です';
      return sameOnly;
    }

    var sameAccount = a.q2 === 'same' || a.q2 === 'unknown';
    /* 過去の版が残っても、普段の管理者アカウントで消せるなら、攻撃者にとっては消せない設定がないのと同じ。 */
    var noLock = a.q4 === 'none' || a.q4 === 'unknown' || (a.q4 === 'versions' && sameAccount);
    /* 取り外して保管している写しは、ネットワーク越しには消せない。 */
    var offlineCopy = places.indexOf('removable') !== -1;
    if (sameAccount && noLock && !offlineCopy) {
      return deletionResult('weak', '保存先を消せるアカウントにも、消せない期間の設定にも守りがないため、管理者の権限を取られると、保存先の中身をそのまま消せます。', holds, unknownNumbers);
    }
    /* 社内でつないだままの機器にしか写しがなければ、権限を分けていても、社内に入った攻撃者は写しまで暗号化できる。 */
    if (!hasSeparate && !locked) {
      var onsite = deletionResult('weak', '写しがすべて社内でつないだままの機器にあり、消せない期間の設定もないため、社内に入った攻撃者は、アカウントの分け方にかかわらず、写しまで暗号化できます。', holds, unknownNumbers);
      onsite.label = '社内に入られると、写しまで暗号化されうる構成です';
      return onsite;
    }
    /* 社内から見えないことは守りに数えるが、それだけでは最も強い段階にしない。 */
    if (hasSeparate && locked && separateAccount) {
      /* この段階では問3は判定に響かないので、「守りがないものとして扱った」とは書かない。 */
      return deletionResult('strong', '社外または取り外し保管の写しがあり、保存先のアカウントが普段の管理者と別で多要素認証もかかっていて、消せない期間の設定もあります。', holds, []);
    }
    if (offlineCopy) {
      return deletionResult('middle', '取り外して保管している写しは、ネットワーク越しには消せません。ただし、取り外すまでの間と、つなぎ直したときには手が届きます。最後に取り外した日より後のデータは、その写しには残りません。', holds, unknownNumbers);
    }
    if (!separateAccount && !locked && !outOfSight) {
      return deletionResult('weak', 'アカウントの分離、社内から見えない置き方、消せない期間の設定のいずれにも、確かな守りがありません。', holds, unknownNumbers);
    }
    return deletionResult('middle', '効いている守りはありますが、仕事場の権限だけでは消せないと言える条件までは、そろっていません。', holds, unknownNumbers);
  }

  /*
   * 「分からない」と答えた問のうち、判定に効く問だけを残す（効かない問を「判定が変わります」と書かない）。
   * ほかの「分からない」の問がどう確かめられても判定が変わらない問を外す。ほかの問の答えの組み合わせを
   * すべて試し、その問だけを変えて判定が変わる組み合わせが1つでもあれば残す。
   */
  function impactfulUnknowns(a, numbers, judgeLevel) {
    function choices(number) {
      return questionById('q' + number).options.map(function (option) { return option.value; });
    }
    function assignments(rest) {
      if (rest.length === 0) return [{}];
      var tail = assignments(rest.slice(1));
      var out = [];
      choices(rest[0]).forEach(function (value) {
        tail.forEach(function (partial) {
          var next = { };
          Object.keys(partial).forEach(function (key) { next[key] = partial[key]; });
          next['q' + rest[0]] = value;
          out.push(next);
        });
      });
      return out;
    }
    return numbers.filter(function (number) {
      var others = numbers.filter(function (other) { return other !== number; });
      return assignments(others).some(function (partial) {
        var levels = {};
        choices(number).forEach(function (value) {
          var changed = {};
          Object.keys(a).forEach(function (key) { changed[key] = a[key]; });
          Object.keys(partial).forEach(function (key) { changed[key] = partial[key]; });
          changed['q' + number] = value;
          levels[judgeLevel(changed)] = true;
        });
        return Object.keys(levels).length > 1;
      });
    });
  }

  function withUnknowns(result, numbers, treatedAs) {
    result.unknownQuestions = numbers;
    result.unknownNote = unknownNote(numbers, treatedAs);
    return result;
  }

  /* gaps は、確認事項が決まったあとに diagnose が入れる。 */
  function restoreResult(level, holds, unknownNumbers, deletionLevel) {
    return {
      level: level,
      stage: RESTORE_LEVELS[level].stage,
      label: RESTORE_LEVELS[level].label,
      reason: null,
      holds: holds,
      gaps: [],
      unknownQuestions: unknownNumbers,
      unknownNote: unknownNote(unknownNumbers, '確かめられていない・備えがない'),
      dependsNote: deletionLevel === 'strong' ? null
        : 'ここで見ているのは、写しが残っている場合の話です。写しそのものを消されたときは、戻す元がなくなります。'
    };
  }

  /* B. 戻せるか（問5・6・8）。 */
  function judgeRestore(a, deletionLevel) {
    if (a.noBackup) {
      var none = restoreResult('weak', [], [], deletionLevel);
      none.label = NO_BACKUP.restoreLabel;
      none.reason = NO_BACKUP.restoreReason;
      none.dependsNote = null;
      return none;
    }
    var unknownNumbers = [];
    if (a.q5 === 'unknown') unknownNumbers.push(5);
    if (a.q6 === 'unknown') unknownNumbers.push(6);
    if (a.q8 === 'unknown') unknownNumbers.push(8);

    var holds = [];
    if (a.q5 === 'half') holds.push('半年以内に、写しからファイルを取り出して確かめています。');
    if (a.q6 === 'full') holds.push('取り出しの手順書が対象ごとにあり、更新日も分かります。');
    if (a.q8 === 'watched') holds.push('保存の結果を、毎日確認しています。');

    var level = 'middle';
    var noProcedure = a.q6 === 'none' || a.q6 === 'unknown';
    if (a.q5 === 'never' || a.q5 === 'unknown' || (a.q5 === 'older' && noProcedure)) {
      level = 'weak';
    } else if (a.q5 === 'half' && a.q6 === 'full' && a.q8 === 'watched') {
      level = 'strong';
    }
    return restoreResult(level, holds, unknownNumbers, deletionLevel);
  }

  /* C. 確認事項。 */
  function collectFindings(a, deletionIsStrong) {
    var keys = [];
    var places = a.q1;
    var hasSeparate = places.indexOf('removable') !== -1 || places.indexOf('offsite') !== -1;
    if (a.noBackup) {
      keys.push('q1-none');
    } else {
      if (places.indexOf('unknown') !== -1) keys.push('q1-unknown');
      else if (places.length === 1 && places[0] === 'same') keys.push('q1-same-only');
      else if (!hasSeparate) keys.push('q1-onsite-only');

      if (a.q2 !== 'mfa') keys.push('q2-' + a.q2);
      if (a.q4 !== 'locked') keys.push('q4-' + a.q4);
      if (a.q3 !== 'hidden') keys.push('q3-' + a.q3 + (deletionIsStrong ? '-extra' : ''));
      if (a.q5 !== 'half') keys.push('q5-' + a.q5);
      if (a.q6 !== 'full') keys.push('q6-' + a.q6);
      if (a.q8 !== 'watched') keys.push('q8-' + a.q8);
    }
    if (a.q7 !== 'documented') keys.push('q7-' + a.q7);
    if (a.q9 !== 'documented') keys.push('q9-' + a.q9);
    if (a.q10 !== 'shared') keys.push('q10-' + a.q10);

    return FINDING_ORDER
      .filter(function (key) { return keys.indexOf(key) !== -1; })
      .map(function (key, index) {
        var text = FINDING_TEXTS[key];
        return {
          id: key,
          order: index + 1,
          questionNumber: text.number,
          area: text.area,
          areaLabel: AREA_LABELS[text.area],
          unknown: text.unknown === true,
          title: text.title,
          why: text.why,
          fix: text.fix
        };
      });
  }

  /* D. 評価制度の項目ごとに、今の回答で示せる材料があるか。 */
  function criterionStatus(id, a) {
    var places = a.q1;
    if (id === '4-3-4-1') {
      if (a.noBackup) return ['lacking', '写しを取っていないため、示せる材料がありません。'];
      if (places.indexOf('unknown') !== -1) return ['lacking', '写しがどこにあるか分かっていないため、取得していることを示せません。'];
      if (a.q7 === 'documented') return ['available', '対象・頻度・保管期間を決めた文書が材料になります。期間中に取得した記録も、あわせて残します。'];
      if (a.q7 === 'settings') return ['lacking', '設定はありますが、対象・頻度・保管期間を定めたことを示す文書がありません。'];
      if (a.q7 === 'none') return ['lacking', '対象・頻度・保管期間を定めた文書がありません。'];
      return ['lacking', '対象・頻度・保管期間を定めた文書があるか、分かっていません。'];
    }
    if (id === '4-3-4-2') {
      if (places.indexOf('offsite') !== -1) return ['available', '社外に置いた写しが材料になります。保管先の場所と、管理の分け方を書き留めておきます。'];
      if (places.indexOf('removable') !== -1) return ['available', '取り外して保管している媒体が材料になります。ただし、元のデータと同じ建物に置いている場合は、遠隔地とは言いにくくなります。保管場所を確かめてください。'];
      if (a.noBackup) return ['lacking', '写しを取っていないため、示せる材料がありません。'];
      if (places.indexOf('unknown') !== -1) return ['lacking', '写しがどこにあるか分かっていないため、示せる材料がありません。'];
      return ['lacking', '社外や取り外し保管の写しがありません。'];
    }
    if (id === '4-3-4-3') {
      if (a.noBackup) return ['lacking', '写しを取っていないため、示せる材料がありません。'];
      if (a.q6 === 'full') return ['available', '対象ごとの手順書と、その更新日が材料になります。'];
      if (a.q6 === 'stale') return ['lacking', '手順はありますが、対象ごとに整い、更新日が分かる形になっていません。'];
      if (a.q6 === 'none') return ['lacking', '取り出しの手順書がありません。'];
      return ['lacking', '取り出しの手順書があるか、分かっていません。'];
    }
    if (id === '7-1-1-1') {
      if (a.noBackup) return ['lacking', '写しを取っていないため、業務を回復するための対策が整っていません。'];
      var missing = [];
      if (a.q9 === 'informal') missing.push('止まると困る仕事と戻したい期限が、文書になっていません。');
      if (a.q9 === 'none') missing.push('止まると困る仕事と戻したい期限が、決まっていません。');
      if (a.q10 === 'vendor') missing.push('事故のときの連絡先と戻す担当について、保守会社との取り決めがありません。');
      if (a.q10 === 'none') missing.push('事故のときの連絡先と戻す担当が、決まっていません。');
      if (a.q9 === 'unknown') missing.push('止まると困る仕事と戻したい期限が決まっているか、分かっていません。');
      if (a.q10 === 'unknown') missing.push('事故のときの連絡先と戻す担当が決まっているか、分かっていません。');
      if (missing.length === 0) return ['partial', '止まると困る仕事と戻したい期限の文書、事故のときの連絡先と役割の取り決めが、材料の一部になります。この基準は、業務を回復するための対策（予備機や、電話・FAXでの連絡手段など）の整備そのものを求めています。'];
      return ['lacking', missing.join('')];
    }
    /* 7-1-1-2。原文は「手順書どおりに」「目標復旧時間内で」の確認を求めるので、問5・6・9がそろうときだけ材料ありとする。 */
    if (a.noBackup) return ['lacking', '写しを取っていないため、示せる材料がありません。'];
    var lacks = [];
    if (a.q5 === 'older') lacks.push('最後に取り出して確かめてから1年より長くたっており、いまの状態を示す材料としては古くなっています。');
    if (a.q5 === 'never') lacks.push('取り出して確かめた記録がありません。');
    if (a.q5 === 'unknown') lacks.push('取り出して確かめた時期が分かっていません。');
    if (places.indexOf('unknown') !== -1) lacks.push('写しの場所が分かっていないため、取り出して確かめた記録が、どの写しのものかを示せません。');
    if (a.q6 === 'unknown') lacks.push('「手順書どおりに」戻せたことを示すための、対象ごとの手順書があるか分かっていません。');
    else if (a.q6 !== 'full') lacks.push('「手順書どおりに」戻せたことを示すための、対象ごとの手順書が整っていません。');
    if (a.q9 === 'unknown') lacks.push('「目標復旧時間内で」戻せたことを示すための、戻したい期限を決めた文書があるか分かっていません。');
    else if (a.q9 !== 'documented') lacks.push('「目標復旧時間内で」戻せたことを示すための、戻したい期限を決めた文書がありません。');
    if (lacks.length > 0) return ['lacking', lacks.join('')];
    var daily = a.q8 === 'watched' ? '' : '保存の失敗に気づく日々の確認（問8）は、この項目とは別の課題として「戻せるか」の判定に出ています。';
    return ['available', '取り出して確かめた日付・対象・結果の記録が材料になります。手順書どおりに進めたことと、戻したい期限に収まったかが分かるよう、かかった時間も記録に残します。' + daily];
  }

  function buildCriteria(a) {
    return CRITERIA.map(function (criterion) {
      var status = criterionStatus(criterion.id, a);
      return {
        id: criterion.id,
        stage: criterion.stage,
        text: criterion.text,
        questions: criterion.questions.slice(),
        status: status[0],
        statusLabel: STATUS_LABELS[status[0]],
        note: status[1]
      };
    });
  }

  /* 回答の控え。 */
  function summarizeAnswers(a, required) {
    return QUESTIONS.map(function (question) {
      var skipped = required.indexOf(question.id) === -1;
      var values = question.type === 'multi' ? a[question.id] : [a[question.id]];
      return {
        questionId: question.id,
        number: question.number,
        text: question.text,
        skipped: skipped,
        answers: skipped ? [] : values.map(function (value) { return optionLabel(question, value); })
      };
    });
  }

  /*
   * 回答から結果を作る。
   * 未回答や使えない回答があるときは判定せず、{ ok: false, errors } を返す。
   */
  function diagnose(answers) {
    var problems = findProblems(answers);
    if (problems.length > 0) {
      return { ok: false, errors: problems };
    }
    var required = requiredQuestionIds(answers);
    var a = { q1: normalizePlaces(answers.q1), noBackup: hasNoBackup(answers) };
    QUESTIONS.forEach(function (question) {
      if (question.type === 'multi') return;
      a[question.id] = required.indexOf(question.id) === -1 ? null : answers[question.id];
    });

    var deletion = judgeDeletion(a);
    /* 写しの場所が分からないときは、場所が分かれば問2〜4も効いてくるので、すべて残す。 */
    if (a.q1.indexOf('unknown') === -1 && !a.noBackup) {
      withUnknowns(deletion, impactfulUnknowns(a, deletion.unknownQuestions,
        function (x) { return judgeDeletion(x).level; }), '守りがない');
    }
    var restore = judgeRestore(a, deletion.level);
    if (!a.noBackup) {
      withUnknowns(restore, impactfulUnknowns(a, restore.unknownQuestions,
        function (x) { return judgeRestore(x, deletion.level).level; }), '確かめられていない・備えがない');
    }
    var findings = collectFindings(a, deletion.level === 'strong');
    /* 足りない点は、確認事項の見出しをそのまま使う（同じ内容を二か所に書かない）。 */
    function titlesOf(area) {
      return findings
        .filter(function (finding) { return finding.area === area; })
        .map(function (finding) { return finding.title + '。'; });
    }
    if (!a.noBackup) {
      deletion.gaps = titlesOf('deletion');
      restore.gaps = titlesOf('restore');
    }
    deletion.improvements = titlesOf('extra');
    return {
      ok: true,
      deletion: deletion,
      restore: restore,
      findings: findings,
      criteria: buildCriteria(a),
      answers: summarizeAnswers(a, required)
    };
  }

  return {
    QUESTIONS: QUESTIONS,
    CRITERIA: CRITERIA,
    DELETION_LEVELS: DELETION_LEVELS,
    RESTORE_LEVELS: RESTORE_LEVELS,
    requiredQuestionIds: requiredQuestionIds,
    findProblems: findProblems,
    diagnose: diagnose
  };
});
