export default function AboutSettings() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-3 text-center py-6">
      <div className="text-6xl">📸</div>
      <h1 className="text-2xl font-bold text-gray-800">SimplShot</h1>
      <a
        href="https://www.simplshot.com"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-600 hover:underline"
      >
        www.simplshot.com
      </a>
      <p className="text-sm text-gray-500">Version 0.1.0</p>
      <p className="text-sm text-gray-500">
        Made by{' '}
        <a href="https://atle.co" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
          Atle Mo
        </a>
      </p>
      <p className="text-xs text-gray-400 max-w-xs pt-1">
        Cross-platform port built with Tauri, based on the macOS{' '}
        <a
          href="https://github.com/atlemo/SimplShot-App"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          SimplShot App
        </a>
        .
      </p>

      <div className="pt-4 border-t border-gray-200 w-full max-w-xs space-y-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Acknowledgments</p>
        <p className="text-xs text-gray-400">
          <a href="https://github.com/sindresorhus/KeyboardShortcuts" target="_blank" rel="noreferrer" className="hover:underline">
            KeyboardShortcuts
          </a>{' '}
          by Sindre Sorhus
        </p>
      </div>
    </div>
  );
}
