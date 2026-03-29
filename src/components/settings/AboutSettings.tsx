export default function AboutSettings() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '0 40px 16px',
      textAlign: 'center',
      gap: 0,
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        {/* App icon placeholder (macOS-style camera icon) */}
        <div style={{
          width: 64, height: 64,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #1c7cef 0%, #0047ab 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          📸
        </div>

        {/* App name */}
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>SimplShot</div>

        {/* Website */}
        <a
          href="https://www.simplshot.com"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: 'var(--mac-secondary)', textDecoration: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
        >
          www.simplshot.com
        </a>

        {/* Version */}
        <div style={{ fontSize: 13, color: 'var(--mac-secondary)' }}>Version 0.1.1</div>

        {/* Author */}
        <div style={{ fontSize: 13, color: 'var(--mac-secondary)' }}>
          Made by{' '}
          <a
            href="https://atle.co"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--mac-secondary)', textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
          >
            Atle Mo
          </a>
        </div>
      </div>

      {/* Acknowledgments at bottom */}
      <div style={{ width: '100%' }}>
        <div style={{ height: 1, background: 'var(--mac-separator)', margin: '0 0 12px' }} />
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--mac-secondary)', marginBottom: 4 }}>
          Acknowledgments
        </div>
        <div style={{ fontSize: 11, color: 'var(--mac-tertiary)', lineHeight: 1.6 }}>
          <a
            href="https://github.com/sindresorhus/KeyboardShortcuts"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--mac-secondary)', textDecoration: 'none' }}
          >
            KeyboardShortcuts
          </a>
          {' '}by Sindre Sorhus
        </div>
      </div>
    </div>
  );
}
