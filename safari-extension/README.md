# せどりAI Safari連携

iPadOS Safari用Web Extensionのソースです。7サイトの検索ページを開き、公開表示されている商品名・価格・画像・URLをせどりAIへ返します。

## 重要

- 利用前に各対象サイトへのアクセス許可が必要です。
- CAPTCHA、本人確認、再ログインは自動回避しません。
- サイトのHTML変更時は `collector.js` の抽出規則を更新します。
- 質問送信と購入確定は自動化しません。
- iPadへ導入するにはSafari Web Extensionとしてパッケージ化・署名・配布する必要があります。
