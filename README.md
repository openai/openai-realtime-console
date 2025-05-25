# talkive

**talktive** は、[openai-realtime-console](https://github.com/openai/openai-realtime-console) をベースに、**音声のカスタマイズ機能**（TTS音声の選択や音量調整）を追加した拡張プロジェクトです。

[OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) と [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc) を活用し、リアルタイムのAI音声体験を自分好みに調整できます。
（未実装です）
---

## 🔊 主な特徴

- 🎙 **音声の種類を選択可能(実装予定)**  
  - 使用可能な声：`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- 🔈 **音量ブースト対応（実装予定）**（Web Audio API による）
- 🖥 WebRTCを利用した双方向のリアルタイム音声通信
- 🔧 カスタム音声アプリや音声チャットUIのプロトタイピングに最適

---

## 🚀 はじめかた

1. OpenAI の APIキーを取得  
   👉 [こちらで作成](https://platform.openai.com/settings/api-keys)

2. `.env` ファイルを作成してキーを設定：

```bash
cp .env.example .env
````

3. 必要なパッケージをインストール：

```bash
npm install
```

4. アプリを起動：

```bash
npm run dev
```

5. ブラウザで以下にアクセス：
   [http://localhost:3000](http://localhost:3000)

---

## 📁 プロジェクト構成

* `/client`：React + Vite ベースのフロントエンド
* `/server.js`：セッション作成＆音声タイプ反映のExpressサーバー
* `/public`：静的アセット

---

## 🧬 元になったプロジェクト

このプロジェクトは OpenAI 公式の [openai-realtime-console](https://github.com/openai/openai-realtime-console) をベースに、音声カスタマイズ機能を追加したものです。

より高度な構成例を探している場合は、Next.js ベースの [openai-realtime-agents](https://github.com/openai/openai-realtime-agents) も参考になります。

---

## 📜 ライセンス
MIT ライセンス
