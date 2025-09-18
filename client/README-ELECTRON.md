# Face Recognition Electron App

This is a desktop application built with Electron that wraps the face recognition web application.

## Features

- **Desktop App**: Native desktop application for Windows, macOS, and Linux
- **Face Recognition**: Employee face recognition using DroidCam
- **Admin Dashboard**: Administrative controls and management
- **User Dashboard**: User access interface
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Running in Development Mode

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server and Electron app:
   ```bash
   npm run electron-dev
   ```

   This will:
   - Start the Next.js development server on http://localhost:3000
   - Launch the Electron app pointing to the development server

### Building for Production

1. Build the Next.js app and create Electron distribution:
   ```bash
   npm run build-electron
   ```

2. Create distribution packages:
   ```bash
   npm run dist
   ```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js app for production
- `npm run electron` - Run Electron app (requires built app)
- `npm run electron-dev` - Run Electron app in development mode
- `npm run build-electron` - Build and package Electron app
- `npm run dist` - Create distribution packages

## Project Structure

```
client/
├── app/                    # Next.js app directory
├── components/             # React components
├── electron.js            # Main Electron process
├── public/                # Static assets
├── out/                   # Built Next.js app (after build)
└── dist/                  # Electron distribution packages
```

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Auto-updater**: Built-in update mechanism
- **Native menus**: Platform-specific application menus
- **Security**: Context isolation and secure defaults
- **DevTools**: Developer tools available in development mode

## Troubleshooting

1. **App won't start**: Make sure all dependencies are installed with `npm install`
2. **Build fails**: Ensure Next.js app builds successfully first with `npm run build`
3. **Electron window blank**: Check that the Next.js dev server is running on port 3000

## Next Steps

The app is now ready for face recognition features. You can:
- Add camera access permissions
- Implement face detection algorithms
- Add employee database integration
- Configure DroidCam connection
