# サイトのアクセス分析

静的な会社サイトとReactのサービス・問い合わせ画面は、同じ`client/public/site-analytics.js`でGA4へ送信します。滞在時間はGA4の標準`user_engagement`を利用します。独自の滞在時間データベースや定期送信はありません。

## 設定・停止

1. CRUD5thの正しいGoogle Analyticsアカウントで無料のGA4プロパティとWebストリームを確認します。広告・Google Signals・BigQuery・Analytics 360は不要です。
2. Webストリームの「拡張計測機能（Enhanced Measurement）」をOFFにします。特に履歴変更による自動ページビュー・フォーム操作・サイト内検索の自動収集を有効にしないでください。手動イベントと重複し、任意URLやフォーム情報が自動収集されるのを防ぎます。標準`user_engagement`は拡張計測機能とは別です。
3. 本番ビルド環境の`GA4_MEASUREMENT_ID`へ確認した`G-...`を設定し、通常の`npm run check && npm run build:static`で公開します。IDは秘密鍵ではありません。空/未設定ならGoogleタグを読み込まず、計測は停止します。不正な形式はビルド時にエラーになります。
4. 現在はHTTPSの`crud5th.com`だけを対象にしています。localhost・プレビュー・iframeへは送信しません。独自ドメインを追加するときは、公開先を確認してtrackerのexact hostname判定と同じテストを更新してください。

停止はIDを削除して再ビルド・公開するか、この変更をrevertします。Cookie制限・広告ブロック・Do Not Track・オプトアウト等で欠測します。送信リトライや独自キューは追加していません。

## 見る指標

| イベント | 意味 | 確認する場所 |
| --- | --- | --- |
| `page_view` | 初回と異なるページへの移動。Swup・Wouter・戻る/進むを含む。同じページ内のアンカーやquery変更は除外 | レポート→エンゲージメント→ページとスクリーン。ディメンションは「ページパスとスクリーンクラス」 |
| `user_engagement` | GA4標準のアクティブな閲覧時間。開いたままの全経過時間とは異なる | 同じページレポートの平均エンゲージメント時間 |
| `kotoport_pricing_view` | 料金セクションの一部が画面内に入ったとき。ページ滞在ごとに1回 | レポート→エンゲージメント→イベント |
| `kotoport_calculator_use` | 有効な入力を変えたとき。`calculator`は`pricing`か`economics`。ページ滞在ごとに各1回、入力値は送信しない | イベント。種別比較が必要なら管理→カスタム定義で`calculator`をイベントスコープに登録 |
| `kotoport_contact_click` | コトポートの相談リンクをクリック | イベント |
| `generate_lead` | 問い合わせPOSTの成功応答後。送信クリックやエラーは含めない | イベント。成果にする場合は管理でキーイベントに設定 |

`page_title`は個人情報を含むタイトルを避け、`CRUD5th`と既知のページパスを使います。`page_location`と`page_referrer`は初回config前のsetとページ移動後のset/イベントで正規化します。configにはページ値を固定しないため、標準engagementも現在のページ値を使います。query/hashは除外し、未知のパスは`/404`へ集約します。外部参照元はoriginだけを使います。UTMもすべて除外しているため、営業キャンペーン別の分析は今回未対応です。フォーム値・入力した人数/料金/分数・検索文字・任意IDは送信しません。Googleの標準イベント、Cookie等の取扱いはGoogleの仕様に従います。

## 更新と確認

静的HTMLのページパスはビルド時に自動収集します。Reactに公開ページを追加するときは`bin/build-corporate-static.mjs`の`pagePaths`にも追加します。計測は属性と固定イベントで接続し、CSSのDOM階層へ依存しません。問い合わせの成功通知は既存の`response.ok`後の`onSuccess`にあります。

ローカルの`node --test bin/site-analytics.test.mjs`は、Node VM上の代替ブラウザへ実trackerを読み込みます。先にビルドし、ID付きビルドの検証ではテストにも同じ`GA4_MEASUREMENT_ID`を渡します（未設定ビルドではテストも未設定）。Googleへ通信せず、初回/2種類の画面移動/戻る/アンカー/host制限/個人情報除外/意味イベントを確認します。`G-TESTONLY`はこの閉じたVMのfixtureだけに使い、本番IDや実Google受信の証拠にしません。

公開後は、実際の本番ブラウザでGoogleのcollect requestが正しい測定IDへだけ送られること、URL値が正規化されていること、各画面移動が1回であることを確認し、その後GA4のリアルタイム/DebugViewで受信を別に確認します。corporateの読み込み元にはテンプレ由来の別測定IDの無効な`window.gtag`フックが残るため、このtrackerはglobal `gtag`を定義しません。将来Googleタグ/GTMを別に追加するときは、このフックを含めて二重送信や別IDへの送信を再点検してください。

公開・Google側受信・日次レポートの蓄積は、ローカルテストやビルド成功とは別の確認です。導入前のページ閲覧/滞在時間は遡って復元できません。保守担当はCRUD5thサイトの運用者です。
