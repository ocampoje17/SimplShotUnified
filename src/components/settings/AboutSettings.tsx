export default function AboutSettings() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
      <div className="text-6xl">📸</div>
      <h1 className="text-2xl font-bold text-gray-800">SimplShot</h1>
      <p className="text-gray-500">Version 0.1.0</p>
      <p className="text-sm text-gray-500 max-w-sm">
        A cross-platform screenshot tool built with Tauri, ported from the macOS SimplShot app.
      </p>
      <div className="flex gap-3 pt-2">
        <a
          href="https://github.com/atlemo/SimplShot-App"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          Original App
        </a>
      </div>
    </div>
  );
}
