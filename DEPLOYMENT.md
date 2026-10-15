# Windows installation

The Windows package runs the API and serves the compiled frontend from one
local address. The user's machine does not need Node.js or npm installed.

## Build the installation package

On the build machine, install Node.js 24 or later and run:

```powershell
.\deploy\build-release.ps1
```

The script builds both projects, downloads the official portable Node.js
runtime, installs only the backend's production dependencies into a clean
staging directory, and creates:

```text
release\Sistema-de-Compras-Setup-win-x64.zip
```

Distribute this ZIP to the user. The ZIP contains the app and `install.bat`.

## Install and launch

1. Extract the ZIP.
2. Run `install.bat`.
3. The installer copies the application to the current user's
   `%LOCALAPPDATA%\Programs\Sistema de Compras`, creates Start Menu and
   Desktop shortcuts, starts the service, and opens the default browser at
   `http://127.0.0.1:4317`.

The API listens only on the local machine. SQLite data is stored separately
in `%LOCALAPPDATA%\SistemaCompras\data\app.sqlite` and is not removed when
the application files are replaced.

## Developer launch

With Node.js and npm dependencies installed, run `start-dev.bat` from the
repository root. It starts the NestJS API on port 3000 and the Vite frontend on
port 5173. Vite proxies `/api` requests to the backend.
