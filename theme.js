(function () {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const styleId = 'premium-theme-style';

  const buildStyles = (dark) => {
    const palette = dark
      ? {
          bg: 'radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 35%), radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.18), transparent 30%), #060816',
          surface: 'rgba(12, 18, 32, 0.84)',
          surfaceAlt: 'rgba(15, 23, 42, 0.92)',
          panel: '#0f172a',
          border: 'rgba(148, 163, 184, 0.16)',
          text: '#f8fafc',
          muted: '#94a3b8',
          accent: '#60a5fa',
          accentSoft: 'rgba(96, 165, 250, 0.16)',
          accent2: '#8b5cf6',
          input: 'rgba(15, 23, 42, 0.74)',
          shadow: '0 20px 55px rgba(2, 8, 23, 0.45)',
          hover: 'rgba(96, 165, 250, 0.12)'
        }
      : {
          bg: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 30%), radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.12), transparent 30%), #f4f7fb',
          surface: 'rgba(255, 255, 255, 0.86)',
          surfaceAlt: 'rgba(255, 255, 255, 0.95)',
          panel: '#ffffff',
          border: 'rgba(15, 23, 42, 0.08)',
          text: '#0f172a',
          muted: '#64748b',
          accent: '#2563eb',
          accentSoft: 'rgba(37, 99, 235, 0.10)',
          accent2: '#7c3aed',
          input: '#ffffff',
          shadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
          hover: 'rgba(37, 99, 235, 0.08)'
        };

    return `
      :root {
        color-scheme: ${dark ? 'dark' : 'light'};
        --app-bg: ${palette.bg};
        --app-surface: ${palette.surface};
        --app-surface-alt: ${palette.surfaceAlt};
        --app-panel: ${palette.panel};
        --app-border: ${palette.border};
        --app-text: ${palette.text};
        --app-muted: ${palette.muted};
        --app-accent: ${palette.accent};
        --app-accent-soft: ${palette.accentSoft};
        --app-accent-2: ${palette.accent2};
        --app-input: ${palette.input};
        --app-shadow: ${palette.shadow};
        --app-hover: ${palette.hover};
      }

      body {
        background: var(--app-bg);
        color: var(--app-text);
        transition: background 0.3s ease, color 0.3s ease;
      }

      @keyframes orbFloat {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(40px, 30px) scale(1.08); }
      }

      body::before,
      body::after {
        content: '';
        position: fixed;
        inset: auto;
        pointer-events: none;
        z-index: 0;
        filter: blur(70px);
        opacity: 0.65;
      }

      body::before {
        width: 320px;
        height: 320px;
        top: -80px;
        left: -80px;
        background: ${dark ? 'rgba(96, 165, 250, 0.16)' : 'rgba(37, 99, 235, 0.10)'};
        animation: orbFloat 8s ease-in-out infinite alternate;
      }

      body::after {
        width: 320px;
        height: 320px;
        right: -70px;
        bottom: -70px;
        background: ${dark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(124, 58, 237, 0.10)'};
        animation: orbFloat 10s ease-in-out infinite alternate-reverse;
      }

      body > * {
        position: relative;
        z-index: 1;
      }

      .card,
      .section-card,
      .title-bar,
      .left-panel,
      #left-panel,
      .right-panel,
      #right-panel,
      .app-body,
      .main-layout,
      .image-preview,
      #document-section,
      #file-section,
      #lists-row,
      #viewer-section,
      #viewer-toolbar,
      #viewer-content,
      header,
      .field-wrap,
      .settings-panel,
      .panel-header,
      .panel-body,
      nav.sidebar,
      main,
      .field input,
      .field select,
      .field textarea {
        background: var(--app-surface);
        color: var(--app-text);
        border-color: var(--app-border);
        box-shadow: var(--app-shadow);
        backdrop-filter: blur(16px);
      }

      .title-bar,
      #topbar,
      header {
        background: linear-gradient(135deg, var(--app-accent) 0%, var(--app-accent-2) 100%);
        color: #ffffff;
        border-color: transparent;
        box-shadow: 0 10px 28px rgba(37, 99, 235, 0.22);
      }

      /* Specific text color overrides for subheaders and sidebar lists */
      .section-card .section-header,
      #left-panel-title,
      #document-section-title,
      #file-section-title,
      .panel-header {
        background: var(--app-surface-alt);
        color: var(--app-text);
        border-color: var(--app-border);
      }

      .sidebar-label,
      .page-sub,
      .panel-header p,
      .field label,
      .field-label,
      .detail-label,
      .count-badge,
      .patient-name-label,
      th {
        color: var(--app-muted) !important;
      }

      .detail-value {
        color: var(--app-text) !important;
      }

      .detail-value.placeholder {
        color: var(--app-muted) !important;
        opacity: 0.6;
      }

      .patient-name-value,
      #viewer-filename {
        color: var(--app-accent) !important;
      }

      /* Scrollable file boxes in indexing view */
      .file-list-box {
        background: var(--app-input) !important;
        color: var(--app-text) !important;
        border-color: var(--app-border) !important;
      }

      .file-list-loading {
        color: var(--app-text) !important;
      }

      .btn-refresh {
        background: var(--app-accent-soft) !important;
        color: var(--app-accent) !important;
        border-color: var(--app-border) !important;
      }

      /* Welcome text and card overrides in dashboard.html */
      .welcome-text h2 {
        color: var(--app-text) !important;
      }

      .welcome-text p {
        color: var(--app-muted) !important;
      }

      .card-title {
        color: var(--app-text) !important;
      }

      .card-desc {
        color: var(--app-muted) !important;
      }

      /* Branding overrides in index.html */
      .brand h1 {
        color: var(--app-text) !important;
      }

      .brand p {
        color: var(--app-muted) !important;
      }

      .footer {
        color: var(--app-muted) !important;
      }

      .nav-item {
        color: var(--app-muted);
      }

      .nav-item.active {
        background: var(--app-accent-soft);
        color: var(--app-accent);
      }

      .opip-item,
      .document-item,
      .file-item,
      .card,
      .section-card {
        transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
      }

      .opip-item:hover,
      .document-item:hover,
      .file-item:hover,
      .card:hover {
        background: var(--app-hover);
        transform: translateY(-1px);
      }

      .opip-item.active,
      .document-item.active,
      .file-item.active {
        background: linear-gradient(135deg, var(--app-accent) 0%, var(--app-accent-2) 100%);
        color: #ffffff;
        box-shadow: 0 10px 22px rgba(37, 99, 235, 0.24);
      }

      .field input,
      .field select,
      .field textarea {
        background: var(--app-input);
        color: var(--app-text);
        border: 1px solid var(--app-border);
      }

      .field input[readonly],
      .field input:disabled,
      .field select:disabled {
        background: var(--app-surface-alt);
        color: var(--app-muted);
      }

      .field input::placeholder,
      .field textarea::placeholder {
        color: var(--app-muted);
      }

      .field input:focus,
      .field select:focus,
      .field textarea:focus {
        border-color: var(--app-accent);
        box-shadow: 0 0 0 3px var(--app-accent-soft);
        outline: none;
      }

      #login-error {
        background: rgba(220, 38, 38, 1.16);
        color: #fff1f2;
        border: 1px solid rgba(248, 113, 113, 0.7);
        box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
      }

      #submit-btn {
        box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
      }

      #submit-btn:hover {
        transform: translateY(-1px);
      }
    `;
  };

  const applyTheme = () => {
    const dark = mediaQuery.matches;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildStyles(dark);
  };

  applyTheme();

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', applyTheme);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(applyTheme);
  }
})();
