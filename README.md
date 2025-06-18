# OpenAI Realtime Console

## Description
This project is a web-based console designed to interact with the OpenAI Realtime API. It allows users to establish a real-time, bidirectional communication channel with OpenAI models, stream audio input/output, send and receive events, and manage session lifecycles. It serves as a demonstration and a development tool for building applications using the OpenAI Realtime API.

## Features
- **Real-time Audio Streaming:** Capture audio from the user's microphone and stream it to the OpenAI API, and play back audio responses from the model.
- **Bidirectional Event Communication:** Send and receive JSON-based events to and from the OpenAI model via WebRTC data channels.
- **Session Management:** Initiate and terminate sessions with the OpenAI Realtime API.
- **Token Generation:** Backend endpoint (`/token`) to securely fetch session tokens from the OpenAI API.
- **Event Logging:** Display a chronological log of all events exchanged with the model.
- **Interactive UI:** User-friendly interface built with React for managing sessions, sending messages, and viewing events.
- **Vite-powered Development:** Fast development server with Hot Module Replacement (HMR) and optimized builds.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Frontend:** React, Tailwind CSS
- **Build Tool & Development Server:** Vite
- **Real-time Communication:** WebRTC (RTCPeerConnection, RTCDataChannel)
- **API Integration:** OpenAI Realtime API
- **Environment Management:** dotenv

## Project Structure
```
/
|-- client/         # Frontend React application
|   |-- assets/       # Static assets (images, etc.)
|   |-- components/   # React components
|   |-- pages/        # Page components (if any, structure might vary)
|   |-- entry-client.jsx # Client-side entry point
|   |-- entry-server.jsx # Server-side rendering entry point
|   |-- index.html    # Main HTML template
|   |-- ...           # Other client-specific files
|-- .env.example    # Example environment variables file
|-- server.js       # Backend Express server
|-- package.json    # Project dependencies and scripts
|-- vite.config.js  # Vite configuration
|-- README.md       # This file
|-- ...             # Other project files (LICENSE, .gitignore, etc.)
```

## Setup and Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    Make sure you have Node.js (preferably a recent LTS version) and npm installed.
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Copy the example environment file to a new `.env` file:
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and add your OpenAI API key:
    ```
    OPENAI_API_KEY=your_openai_api_key_here
    ```
    You will also need to specify the `PORT` if you want to use a port other than the default `3000`.

## Running the Project

### Development Mode
To run the project in development mode with Vite's development server and Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will typically be available at `http://localhost:3000` (or the port specified in your `.env` file or `server.js`).

### Production Mode
To run the project in production mode (after building it):
```bash
npm run start
```
This will start the Express server serving the optimized static assets. Ensure you have built the project first (see 'Building the Project' section).

## Environment Variables
The project requires the following environment variables to be set in a `.env` file in the project root:

-   `OPENAI_API_KEY`: **Required**. Your secret API key for accessing the OpenAI API.
-   `PORT`: Optional. The port on which the Express server will run. Defaults to `3000` if not specified.

Example `.env` file:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```
Refer to the `.env.example` file for a template.

## Building the Project
To create a production build of the application, run the following command:
```bash
npm run build
```
This command will:
1.  Build the client-side React application using Vite (`vite build --outDir dist/client --ssrManifest`).
2.  Build the server-side components using Vite (`vite build --outDir dist/server --ssr /index.js`).

The optimized static assets and server build will be placed in the `dist/` directory. After building, you can start the server in production mode using `npm run start`.

## License
