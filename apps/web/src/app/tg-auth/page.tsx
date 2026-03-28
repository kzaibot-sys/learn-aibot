'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe: Record<string, unknown>;
        platform: string;
        version: string;
        colorScheme: string;
        close: () => void;
      };
    };
  }
}

export default function TgAuthPage() {
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const attempted = useRef(false);

  function tryAuth() {
    if (attempted.current) return;
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    attempted.current = true;

    tg.ready();
    tg.expand();

    // Debug info
    const debugInfo = {
      platform: tg.platform,
      version: tg.version,
      initDataLength: tg.initData?.length || 0,
      initDataUnsafe: tg.initDataUnsafe,
    };
    setDebug(JSON.stringify(debugInfo));

    const initData = tg.initData;
    if (!initData) {
      setError(`initData пуст. platform=${tg.platform} version=${tg.version} initDataUnsafe=${JSON.stringify(tg.initDataUnsafe)}`);
      setStatus('error');
      return;
    }

    doAuth(initData);
  }

  async function doAuth(initData: string) {
    setStatus('authenticating');

    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Ошибка авторизации');
        setStatus('error');
        return;
      }

      // Save in Zustand persist format (same as login page)
      const authData = {
        state: {
          user: data.data.user,
          token: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        },
        version: 0,
      };
      localStorage.setItem('lms-auth', JSON.stringify(authData));

      setStatus('success');
      window.location.replace('/dashboard');
    } catch {
      setError('Ошибка соединения');
      setStatus('error');
    }
  }

  useEffect(() => {
    // Poll for Telegram SDK availability
    const interval = setInterval(() => {
      if (window.Telegram?.WebApp) {
        clearInterval(interval);
        tryAuth();
      }
    }, 50);

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!attempted.current) {
        setError('Telegram SDK не загружен. Откройте через Telegram.');
        setStatus('error');
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'var(--tg-theme-bg-color, #ffffff)',
        color: 'var(--tg-theme-text-color, #1E293B)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #ff8533, #ffaa66)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 32, color: 'white', fontWeight: 'bold',
          }}>A</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>AiBot</h1>
          <p style={{ fontSize: 14, color: 'var(--tg-theme-hint-color, #64748B)', marginBottom: 32 }}>
            Образовательная платформа
          </p>

          {status === 'loading' && (
            <>
              <div style={{
                width: 40, height: 40,
                border: '3px solid var(--tg-theme-hint-color, #E2E8F0)',
                borderTopColor: 'var(--tg-theme-button-color, #F97316)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ fontSize: 14, color: 'var(--tg-theme-hint-color, #64748B)' }}>Авторизация...</p>
            </>
          )}

          {status === 'authenticating' && (
            <>
              <div style={{
                width: 40, height: 40,
                border: '3px solid var(--tg-theme-hint-color, #E2E8F0)',
                borderTopColor: 'var(--tg-theme-button-color, #F97316)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ fontSize: 14, color: 'var(--tg-theme-hint-color, #64748B)' }}>Проверка данных...</p>
            </>
          )}

          {status === 'success' && (
            <p style={{ fontSize: 14, color: '#22c55e' }}>Вход выполнен!</p>
          )}

          {status === 'error' && (
            <>
              <p style={{ fontSize: 14, color: '#EF4444', marginBottom: 16 }}>{error}</p>
              <button
                onClick={() => { attempted.current = false; setStatus('loading'); tryAuth(); }}
                style={{
                  background: 'var(--tg-theme-button-color, #F97316)',
                  color: 'var(--tg-theme-button-text-color, #ffffff)',
                  border: 'none', borderRadius: 12,
                  padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >Попробовать снова</button>
            </>
          )}

          {debug && (
            <p style={{ fontSize: 10, color: '#999', marginTop: 20, wordBreak: 'break-all' }}>
              DEBUG: {debug}
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
