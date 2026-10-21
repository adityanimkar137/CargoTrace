# CargoTrace Frontend Client (`client/`)

The React + Vite frontend application for CargoTrace. Built with plain JavaScript, Tailwind CSS, Lucide React icons, and a centralized API client layer.

## Prerequisites

- Node.js 20+
- Running CargoTrace Backend server (default `http://localhost:5000`)

## Installation

```bash
cd client
npm install
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the CargoTrace Express backend REST API | `http://localhost:5000/api/v1` |

## Running the Frontend

Start Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```
