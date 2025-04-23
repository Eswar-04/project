import ARCamera from './components/ARCamera';
import { CameraIcon } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="py-6 px-4 sm:px-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <CameraIcon size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
            CameraPro
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl mb-6 text-center font-medium text-slate-200">
            Live Camera Feed with AR Tracking
          </h2>

          <ARCamera className="mb-8" />

          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 className="text-lg font-medium mb-3 text-slate-200">Instructions</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 text-emerald-400 flex-shrink-0"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                  <path d="m12 11 5 3-5 3v-6Z" />
                </svg>
                Press the green camera button to start your camera feed.
              </li>
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 text-emerald-400 flex-shrink-0"
                >
                  <path d="m21 16-4 4-4-4" />
                  <path d="M17 20V4" />
                  <path d="m3 8 4-4 4 4" />
                  <path d="M7 4v16" />
                </svg>
                If available, use the blue switch button to toggle between cameras.
              </li>
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 text-emerald-400 flex-shrink-0"
                >
                  <path d="M3 7v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
                  <path d="M20.12 3.88 12 12 3.88 3.88a2.8 2.8 0 0 1 4-4L12 4l4.12-4.12a2.8 2.8 0 0 1 4 4Z" />
                </svg>
                Press the red stop button to turn off the camera.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-slate-400">
        © 2025 CameraPro | Created with React, TypeScript, and TailwindCSS
      </footer>
    </div>
  );
}

export default App;