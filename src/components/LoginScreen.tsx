import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/sound-fx';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  onGoRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playPop();
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    if (!password)     { setError('Vui lòng nhập mật khẩu'); return; }
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
      soundFX.playSuccess();
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại, thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    soundFX.playSparkle();
    setEmail('demo@storyweaver.vn');
    setPassword('123456');
    setError('');
  };

  return (
    <div style={styles.root}>
      {/* Background magical aura decoration */}
      <div style={styles.bgBlobTop} />
      <div style={styles.bgBlobBottom} />

      <div
        style={{
          ...styles.container,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ═══════════════════════════════════════════════════════
            HERO BRANDING SECTION (Bold, prominent & unified)
            ═══════════════════════════════════════════════════════ */}
        <div style={styles.heroSection}>
          {/* Logo Brand Title */}
          <div style={styles.brandBadge}>
            <span style={styles.brandIcon}>🐶</span>
            <span style={styles.brandSparkle}>✨</span>
          </div>
          
          <h1 style={styles.brandTitle}>StoryWeaver</h1>
          
          <div style={styles.taglinePill}>
            <span style={{ fontSize: 13, marginRight: 4 }}>🌸</span>
            <span style={styles.taglineText}>VƯỜN CỔ TÍCH DIỆU KỲ CHO BÉ</span>
            <span style={{ fontSize: 13, marginLeft: 4 }}>🌸</span>
          </div>

          {/* Mascot with speech bubble */}
          <div
            style={{ ...styles.mascotContainer, cursor: 'pointer' }}
            onClick={() => soundFX.playPuppy()}
          >
            <div style={styles.mascotCircleAura}>
              <img
                src="/shiba_mascot.jpg"
                alt="Shiba mascot"
                style={styles.mascotImg}
              />
            </div>
            
            {/* Speech bubble */}
            <div style={styles.speechBubble}>
              <span style={styles.speechText}>Gâu gâu! Chào bé & bố mẹ nha! 👋</span>
              <div style={styles.bubbleTail} />
            </div>

            {/* Sparkle decorative dots */}
            <div style={{ ...styles.sparkleDot, top: 0, left: 16, background: '#FFD93D' }}>⭐</div>
            <div style={{ ...styles.sparkleDot, bottom: 8, right: 12, background: '#6BCB77' }}>🍃</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FORM CARD (Clean, cohesive, beautiful)
            ═══════════════════════════════════════════════════════ */}
        <div style={styles.formCard}>
          <h2 style={styles.formHeading}>Đăng nhập</h2>
          <p style={styles.formSubheading}>Cùng bước vào thế giới truyện diệu kỳ</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email Field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email tài khoản</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@gmail.com"
                  style={styles.input}
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Mật khẩu</label>
                <button
                  type="button"
                  style={styles.forgotBtn}
                  onClick={() => alert('Tính năng đặt lại mật khẩu qua email sẽ gửi mã OTP cho bạn! 📧')}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Nhập mật khẩu của bạn"
                  style={{ ...styles.input, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={styles.eyeBtn}
                  title={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Quick Demo Fill Shortcut */}
            <div style={styles.demoFillRow}>
              <button
                type="button"
                onClick={handleFillDemo}
                style={styles.demoFillBtn}
              >
                💡 Nhập nhanh tài khoản Demo
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBanner}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <div style={styles.loadingRow}>
                  <span className="login-spinner" style={styles.spinner} />
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                <span>Đăng nhập ngay 🚀</span>
              )}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>hoặc tiếp tục với</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Google Login */}
            <button
              type="button"
              style={styles.googleBtn}
              onClick={() => alert('Đăng nhập Google: Hệ thống đang kết nối Google OAuth 2.0! 🚀')}
            >
              <GoogleIcon />
              <span>Đăng nhập bằng Google</span>
            </button>
          </form>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FOOTER (Switch to register)
            ═══════════════════════════════════════════════════════ */}
        <div style={styles.footerWrap}>
          <span style={styles.footerText}>Chưa có tài khoản?</span>
          <button
            type="button"
            onClick={onGoRegister}
            style={styles.registerLinkBtn}
          >
            Đăng ký miễn phí ngay ✨
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Google SVG Icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ─── Styling ──────────────────────────────────────────────────────────────────
const GREEN_MAIN = '#388E3C';
const GREEN_VIBRANT = '#4CAF50';
const GREEN_BG = '#F0F9F1';

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(180deg, #EDF7EE 0%, #F5FBF6 40%, #FFFFFF 100%)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    zIndex: 9000,
    fontFamily: "'Nunito', sans-serif",
  },
  bgBlobTop: {
    position: 'absolute',
    top: -80,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 380,
    height: 280,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(107, 203, 119, 0.22) 0%, rgba(255, 217, 61, 0.12) 60%, transparent 100%)',
    pointerEvents: 'none',
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(77, 171, 247, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 20px 32px',
    maxWidth: 420,
    width: '100%',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  brandBadge: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 20,
    background: 'linear-gradient(135deg, #FFD93D 0%, #FFA000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(255, 179, 0, 0.35)',
    marginBottom: 8,
  },
  brandIcon: {
    fontSize: 32,
  },
  brandSparkle: {
    position: 'absolute',
    top: -4,
    right: -6,
    fontSize: 14,
  },
  brandTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 900,
    color: '#1B5E20',
    fontFamily: "'Baloo 2', cursive",
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
    textAlign: 'center',
    textShadow: '0 2px 8px rgba(46, 125, 50, 0.15)',
  },
  taglinePill: {
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(76, 175, 80, 0.12)',
    border: '1px solid rgba(76, 175, 80, 0.25)',
    borderRadius: 9999,
    padding: '3px 12px',
  },
  taglineText: {
    fontSize: 10.5,
    fontWeight: 900,
    color: '#2E7D32',
    letterSpacing: '0.8px',
  },
  mascotContainer: {
    position: 'relative',
    marginTop: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mascotCircleAura: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #FFFFFF 30%, #E8F5E9 75%, #C8E6C9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.18)',
    border: '3px solid #FFFFFF',
  },
  mascotImg: {
    width: 125,
    height: 125,
    objectFit: 'contain',
    animation: 'float 3.5s ease-in-out infinite',
  },
  speechBubble: {
    position: 'absolute',
    right: 12,
    top: 6,
    background: '#FFFFFF',
    padding: '8px 12px',
    borderRadius: 14,
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    border: '1px solid #E8F5E9',
    maxWidth: 145,
  },
  speechText: {
    fontSize: 11,
    fontWeight: 800,
    color: '#2C3E50',
    lineHeight: 1.3,
    display: 'block',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    left: 16,
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid #FFFFFF',
  },
  sparkleDot: {
    position: 'absolute',
    fontSize: 13,
    animation: 'pulse-soft 2s ease-in-out infinite',
  },
  formCard: {
    width: '100%',
    background: '#FFFFFF',
    borderRadius: 24,
    padding: '20px 20px 22px',
    boxShadow: '0 12px 32px rgba(46, 125, 50, 0.08), 0 2px 6px rgba(0,0,0,0.02)',
    border: '1.5px solid #E8F5E9',
  },
  formHeading: {
    margin: '0 0 2px',
    fontSize: 19,
    fontWeight: 800,
    color: '#1E293B',
    fontFamily: "'Baloo 2', cursive",
  },
  formSubheading: {
    margin: '0 0 16px',
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#334155',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #E2E8F0',
    borderRadius: 14,
    background: '#F8FAFC',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  inputIcon: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 14,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '13px 12px',
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 14,
    color: '#1E293B',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: GREEN_MAIN,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  demoFillRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: -4,
  },
  demoFillBtn: {
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    color: '#16A34A',
    fontSize: 11.5,
    fontWeight: 800,
    borderRadius: 8,
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 12,
    padding: '8px 12px',
  },
  errorText: {
    margin: 0,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: 700,
  },
  submitBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 800,
    fontFamily: "'Baloo 2', cursive",
    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    transition: 'transform 0.1s, box-shadow 0.2s',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '4px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#F1F5F9',
  },
  dividerText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  googleBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 14,
    border: '1.5px solid #E2E8F0',
    background: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'border-color 0.2s, background 0.2s',
    fontFamily: "'Nunito', sans-serif",
  },
  footerWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: 600,
  },
  registerLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#2E7D32',
    fontWeight: 800,
    cursor: 'pointer',
    padding: 0,
    fontSize: 13.5,
    textDecoration: 'underline',
    fontFamily: "'Nunito', sans-serif",
  },
};
