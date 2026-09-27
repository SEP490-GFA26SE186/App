import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/sound-fx';

interface RegisterScreenProps {
  onRegister: (name: string, email: string, password: string) => Promise<void> | void;
  onGoLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onGoLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playPop();
    if (!name.trim())     { setError('Vui lòng nhập họ & tên của bạn'); return; }
    if (!email.trim())    { setError('Vui lòng nhập email'); return; }
    if (password.length < 8) { setError('Mật khẩu tối thiểu 8 ký tự (yêu cầu bảo mật)'); return; }
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    setError('');
    setLoading(true);
    try {
      await onRegister(name.trim(), email.trim(), password);
      soundFX.playSuccess();
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại, thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Background magical aura decoration */}
      <div style={styles.bgBlobTop} />
      <div style={styles.bgBlobBottom} />

      {/* Top Bar with Back Button */}
      <div style={styles.topBar}>
        <button
          type="button"
          onClick={onGoLogin}
          style={styles.backBtn}
          title="Quay lại đăng nhập"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={styles.topBarTitle}>Tạo tài khoản mới</span>
        <div style={{ width: 40 }} />
      </div>

      <div
        style={{
          ...styles.container,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ═══════════════════════════════════════════════════════
            HERO BRANDING SECTION
            ═══════════════════════════════════════════════════════ */}
        <div style={styles.heroSection}>
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
              <span style={styles.speechText}>Tạo tài khoản nhận 100 Xu kể chuyện miễn phí! 🎁</span>
              <div style={styles.bubbleTail} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FORM CARD
            ═══════════════════════════════════════════════════════ */}
        <div style={styles.formCard}>
          <h2 style={styles.formHeading}>Đăng ký thành viên</h2>
          <p style={styles.formSubheading}>Bắt đầu hành trình sáng tạo truyện diệu kỳ cùng bé</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Name */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Họ và tên của bạn</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Ví dụ: Mẹ Bích Phương"
                  style={styles.input}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Địa chỉ Email</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@example.com"
                  style={styles.input}
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tạo mật khẩu</label>
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
                  placeholder="Tối thiểu 8 ký tự"
                  style={{ ...styles.input, paddingRight: 44 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={styles.eyeBtn}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Xác nhận lại mật khẩu</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Nhập lại mật khẩu vừa tạo"
                  style={{ ...styles.input, paddingRight: 44 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={styles.eyeBtn}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <PasswordStrength password={password} />
            )}

            {/* Error Message */}
            {error && (
              <div style={styles.errorBanner}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            {/* Submit */}
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
                  <span>Đang tạo tài khoản...</span>
                </div>
              ) : (
                <span>✨ Hoàn tất đăng ký</span>
              )}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>hoặc</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Google */}
            <button
              type="button"
              style={styles.googleBtn}
              onClick={() => alert('Đăng ký bằng Google OAuth 2.0 sẽ sớm ra mắt! 🚀')}
            >
              <GoogleIcon />
              <span>Đăng ký với tài khoản Google</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={styles.footerWrap}>
          <span style={styles.footerText}>Đã có tài khoản rồi?</span>
          <button
            type="button"
            onClick={onGoLogin}
            style={styles.loginLinkBtn}
          >
            Đăng nhập ngay 🔑
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components & Helpers ─────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh'];
  const colors = ['#EF5350', '#FF7043', '#FFC107', '#4CAF50'];

  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 9999,
            background: i < score ? colors[score - 1] : '#E2E8F0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: score > 0 ? colors[score - 1] : '#94A3B8', fontWeight: 700 }}>
        {score > 0 ? `Độ an toàn: ${labels[score - 1]}` : ''}
      </p>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  topBar: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: '#FFFFFF',
    border: '1px solid #E8F5E9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#1B5E20',
    fontFamily: "'Baloo 2', cursive",
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px 32px',
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
    marginBottom: 12,
    width: '100%',
  },
  mascotContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mascotCircleAura: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #FFFFFF 30%, #E8F5E9 75%, #C8E6C9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.16)',
    border: '3px solid #FFFFFF',
  },
  mascotImg: {
    width: 95,
    height: 95,
    objectFit: 'contain',
    animation: 'float 3.5s ease-in-out infinite',
  },
  speechBubble: {
    position: 'absolute',
    right: 8,
    top: 4,
    background: '#FFFFFF',
    padding: '6px 10px',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #E8F5E9',
    maxWidth: 150,
  },
  speechText: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#2C3E50',
    lineHeight: 1.3,
    display: 'block',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -5,
    left: 14,
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop: '5px solid #FFFFFF',
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
    padding: '12px 12px',
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
  loginLinkBtn: {
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
