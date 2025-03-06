# OpenAI Realtime Console

This is an example application showing how to use the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) with [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc).

## 日本語での説明

このアプリケーションは、[OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)を[WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc)と組み合わせて使用する方法を示すサンプルアプリケーションです。WebRTCを使用してリアルタイムの双方向通信を実現し、OpenAIのAPIと連携することができます。

### インストールと使用方法

始める前に、OpenAI APIキーが必要です。[こちらのダッシュボード](https://platform.openai.com/settings/api-keys)でAPIキーを作成してください。`.env.example`ファイルから`.env`ファイルを作成し、そこにAPIキーを設定します：

```bash
cp .env.example .env
```

このアプリケーションをローカルで実行するには、[Node.js](https://nodejs.org/)がインストールされている必要があります。以下のコマンドでアプリケーションの依存関係をインストールします：

```bash
npm install
```

以下のコマンドでアプリケーションサーバーを起動します：

```bash
npm run dev
```

これにより、[http://localhost:3000](http://localhost:3000)でコンソールアプリケーションが起動します。

This application is a minimal template that uses [express](https://expressjs.com/) to serve the React frontend contained in the [`/client`](./client) folder. The server is configured to use [vite](https://vitejs.dev/) to build the React frontend.

This application shows how to send and receive Realtime API events over the WebRTC data channel and configure client-side function calling. You can also view the JSON payloads for client and server events using the logging panel in the UI.

For a more comprehensive example, see the [OpenAI Realtime Agents](https://github.com/openai/openai-realtime-agents) demo built with Next.js, using an agentic architecture inspired by [OpenAI Swarm](https://github.com/openai/swarm).

## Previous WebSockets version

The previous version of this application that used WebSockets on the client (not recommended in browsers) [can be found here](https://github.com/openai/openai-realtime-console/tree/websockets).

## License

MIT
