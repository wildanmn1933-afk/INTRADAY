import React, { useState, useEffect } from 'react';
import {
  Layers,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Send,
  ExternalLink,
  Clock,
  KeyRound,
  Activity,
  Box,
  TrendingUp,
} from 'lucide-react';
import { SplineScene } from './ui/splite';
import {
  api,
  setAuthToken,
  setStoredUser,
  addRegisteredAccount,
} from '../lib/api';
import { User } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  doc,
  setDoc,
  serverTimestamp,
  db as firestoreDb,
} from '../lib/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../lib/LanguageContext';

export type AuthMode =
  | 'login'
  | 'register'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password';

interface AuthPageProps {
  mode: AuthMode;
  onNavigate: (to: string) => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  onNavigate,
  onSuccess,
}) => {
  const { t } = useLanguage();
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading & status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Password reset state
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  // Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Token auto-verifying state (from URL query)
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [tokenVerifySuccess, setTokenVerifySuccess] = useState<string | null>(null);
  const [tokenVerifyError, setTokenVerifyError] = useState<string | null>(null);

  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const isVerifyEmail = mode === 'verify-email';

  // Listen to cross-tab verification signals and poll verification status
  useEffect(() => {
    const activeTargetEmail = (registeredEmail || email).trim().toLowerCase();
    if (!verificationPending || !activeTargetEmail) return;

    let isMounted = true;

    // 1. Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('arah_market_auth');
      bc.onmessage = (event) => {
        if (event.data?.type === 'EMAIL_VERIFIED' && event.data?.token && event.data?.user) {
          setTokenVerifySuccess('Email verified. Opening the trading terminal...');
          setAuthToken(event.data.token);
          setStoredUser(event.data.user);
          setTimeout(() => {
            onSuccess(event.data.user, event.data.token);
          }, 600);
        }
      };
    } catch {}

    // 2. Storage event listener (fallback for browsers without BroadcastChannel)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'arah_market_verified_ping' || e.key === 'arah_market_auth_token') {
        const storedToken = localStorage.getItem('arah_market_auth_token');
        if (storedToken) {
          api.getMe()
            .then(meRes => {
              if (isMounted && meRes?.user) {
                setTokenVerifySuccess('Email verified. Opening the terminal...');
                setAuthToken(storedToken);
                setStoredUser(meRes.user);
                setTimeout(() => onSuccess(meRes.user, storedToken), 600);
              }
            })
            .catch(() => {});
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Regular active polling every 2.5 seconds to detect email clicks without refreshing
    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const status = await api.checkVerificationStatus(activeTargetEmail);
        if (status.is_verified && status.token && status.user) {
          clearInterval(pollInterval);
          setTokenVerifySuccess('Your email is verified. Opening the terminal...');
          setAuthToken(status.token);
          setStoredUser(status.user);
          setTimeout(() => {
            onSuccess(status.user!, status.token!);
          }, 600);
        }
      } catch {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorage);
      try { bc?.close(); } catch {}
    };
  }, [verificationPending, registeredEmail, email, onSuccess]);

  // Check URL query parameters on mount or mode change
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');
    const verifiedParam = urlParams.get('verified');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (verifiedParam === 'true' || verifiedParam === '1') {
      setTokenVerifySuccess('Your email has been verified. Please sign in with your account.');
    }

    if (token) {
      if (isResetPassword || window.location.pathname === '/reset-password') {
        setResetToken(token);
      } else {
        setTokenVerifying(true);
        setError(null);
        setTokenVerifyError(null);
        api.verifyEmail(token)
          .then((res) => {
            setTokenVerifySuccess('Email verified. Opening the trading terminal...');
            setAuthToken(res.token);
            setStoredUser(res.user);
            setTimeout(() => {
              onSuccess(res.user, res.token);
            }, 1000);
          })
          .catch((err: any) => {
            setTokenVerifyError(err.message || t('Tautan verifikasi tidak valid atau telah kedaluwarsa.', 'That verification token is invalid or has expired.'));
          })
          .finally(() => {
            setTokenVerifying(false);
          });
      }
    }
  }, [isResetPassword, isVerifyEmail, onSuccess, t]);

  // Clear transient error when switching mode
  useEffect(() => {
    setError(null);
    setErrorCode(null);
    setSuccessMessage(null);
    setResendStatus(null);
  }, [mode]);

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('Masukkan alamat email Anda.', 'Enter your email address.'));
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessMessage(res.message || t('Tautan reset password telah dikirim ke email Anda.', 'A password reset link has been sent to your email.'));
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
      }
    } catch (err: any) {
      setError(err.message || t('Tidak dapat memproses permintaan reset password.', 'Could not request a password reset.'));
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Execution
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError(t('Password baru minimal harus 6 karakter.', 'The new password must be at least 6 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('Konfirmasi password tidak cocok.', 'Password confirmation does not match.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!resetToken) {
        throw new Error(t('Buka tautan reset dari email Anda untuk melanjutkan. Minta tautan baru jika telah kedaluwarsa.', 'Open the reset link from your email to continue. Request a new one if it expired.'));
      }

      const res = await api.resetPassword({
        token: resetToken,
        newPassword,
      });

      setSuccessMessage(t('Password diperbarui. Mengalihkan ke terminal...', 'Password updated. Redirecting to the terminal...'));
      setAuthToken(res.token);
      setStoredUser(res.user);
      addRegisteredAccount({
        email: res.user.email,
        name: res.user.name,
        role: res.user.role,
      });
      setTimeout(() => {
        onSuccess(res.user, res.token);
      }, 900);
    } catch (err: any) {
      setError(err.message || t('Tidak dapat memperbarui password.', 'Could not reset the password.'));
    } finally {
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In with Firebase Auth
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser.email) throw new Error(t('Akun Google tidak memiliki alamat email publik.', 'The Google account has no public email address.'));

      // 1. Authenticate with backend API with a fresh token. The backend verifies this token's
      // signature itself, so it cannot be spoofed with a plain email/uid.
      const idToken = await fbUser.getIdToken(true);
      const apiRes = await api.firebaseLogin({ idToken });

      // 2. Persist user document to Firestore database
      try {
        const userDocRef = doc(firestoreDb, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Trader',
          photoURL: fbUser.photoURL || '',
          lastLogin: serverTimestamp(),
          role: 'USER',
          plan: 'PRO',
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[Firestore] User document sync notice:', fsErr);
      }

      setAuthToken(apiRes.token);
      setStoredUser(apiRes.user);
      onSuccess(apiRes.user, apiRes.token);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || t('Login dengan Google gagal', 'Google sign-in failed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  // Standard Submit Handler (Login / Register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setResendStatus(null);
    setSuccessMessage(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error(t('Masukkan nama lengkap atau trading handle Anda.', 'Enter your full name or trading handle.'));
        }
        const res = await api.register({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        if (res.token && res.user) {
          setSuccessMessage(t(`Selamat datang, ${res.user.name || name}! Akun Anda sudah aktif.`, `Welcome, ${res.user.name || name}! Your account is active.`));
          setAuthToken(res.token);
          setStoredUser(res.user);
          addRegisteredAccount({
            email: res.user.email,
            name: res.user.name,
            role: res.user.role,
          });
          setTimeout(() => {
            onSuccess(res.user, res.token!);
          }, 600);
          return;
        }

        setRegisteredEmail(email.trim());
        setVerificationPending(true);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        setAuthToken(res.token);
        setStoredUser(res.user);
        addRegisteredAccount({
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
        });
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || t('Autentikasi gagal. Periksa email dan password Anda.', 'Authentication failed. Check your email and password.'));
      if (err.code) {
        setErrorCode(err.code);
      }
      if (err.email) {
        setRegisteredEmail(err.email);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async (targetEmail?: string) => {
    const emailToUse = targetEmail || registeredEmail || email;
    if (!emailToUse.trim()) {
      setError(t('Masukkan alamat email Anda terlebih dahulu.', 'Enter your email address first.'));
      return;
    }

    setResendLoading(true);
    setResendStatus(null);
    try {
      const res = await api.resendVerification(emailToUse.trim());
      setResendStatus(res.message || t('Tautan verifikasi baru telah dikirimkan ke email Anda.', 'A new verification link has been sent to your email.'));
    } catch (err: any) {
      setError(err.message || t('Gagal mengirim ulang email verifikasi.', 'Could not resend the verification email.'));
    } finally {
      setResendLoading(false);
    }
  };

  // 6-Digit OTP Verification Handler
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode) {
      setError(t('Masukkan 6 digit kode verifikasi dari email Anda.', 'Enter the 6-digit verification code from your email.'));
      return;
    }
    const targetEmail = registeredEmail || email;
    if (!targetEmail.trim()) {
      setError(t('Alamat email belum ditentukan. Masukkan email Anda terlebih dahulu.', 'No email address set. Enter your email first.'));
      return;
    }

    setOtpVerifying(true);
    setError(null);
    try {
      const res = await api.verifyCode(targetEmail.trim(), cleanCode);
      setTokenVerifySuccess(t('Email terverifikasi. Membuka terminal trading...', 'Email verified. Opening the trading terminal...'));
      setAuthToken(res.token);
      setStoredUser(res.user);
      addRegisteredAccount({
        email: res.user.email,
        name: res.user.name,
        role: res.user.role,
      });
      setTimeout(() => {
        onSuccess(res.user, res.token);
      }, 700);
    } catch (err: any) {
      setError(err.message || t('Kode verifikasi salah atau telah kedaluwarsa.', 'That verification code is incorrect or has expired.'));
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white relative overflow-hidden">
      {/* 3D Robot Background Visual - Positioned to visually merge with page layout */}
      <div className="absolute inset-0 z-0">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
        {/* Gradient Overlay to mask the edges and visually merge with page layout */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[var(--bg-canvas)] via-[var(--bg-canvas)]/75 to-transparent lg:w-3/5" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--bg-canvas)] via-transparent to-[var(--bg-canvas)]/40" />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-[var(--accent-subtle)] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-sm z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('/')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono"
          id="back-home-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth.backHome')}</span>
        </Button>

        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center text-[var(--accent-contrast)] font-bold text-xs">
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)]">
            ARAHMARKET <span className="text-[var(--accent)]">TERMINAL</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle variant="pill" />
          <div className="hidden sm:flex items-center">
            <Badge variant="cyan" className="gap-1.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{t('auth.gatewayBadge')}</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 relative pointer-events-none">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Authentication Form / Card */}
          <div className="lg:col-span-6 xl:col-span-5 w-full flex flex-col items-center pointer-events-auto">
            <Card className="w-full bg-[var(--bg-surface)]/95 backdrop-blur-md border-[var(--border-subtle)] shadow-[var(--shadow-overlay)] p-6 sm:p-8 space-y-6">

          {/* STATE 1: Token Verifying in Progress */}
          {tokenVerifying && (
            <div className="text-center py-8 space-y-4 font-mono">
              <div className="w-12 h-12 rounded-md bg-[var(--accent-subtle)]/80 border border-[var(--accent)]/80 flex items-center justify-center mx-auto text-[var(--accent)] shadow-inner">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('auth.validatingLink')}</h2>
              <p className="text-xs text-[var(--text-secondary)] font-sans">
                {t('auth.validatingLinkDesc')}
              </p>
            </div>
          )}

          {/* STATE 2: Token Verification Success Banner */}
          {tokenVerifySuccess && !tokenVerifying && (
            <div className="p-4 rounded-md bg-[var(--bullish-bg)]/60 border border-[var(--bullish-border)]/80 text-[var(--bullish)] text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-semibold text-[var(--bullish)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--bullish)] shrink-0" />
                <span>{t('auth.authVerified')}</span>
              </div>
              <p>{tokenVerifySuccess}</p>
            </div>
          )}

          {/* STATE 3: Success Message Banner */}
          {successMessage && !tokenVerifySuccess && (
            <div className="p-4 rounded-md bg-[var(--bullish-bg)]/60 border border-[var(--bullish-border)]/80 text-[var(--bullish)] text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-semibold text-[var(--bullish)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--bullish)] shrink-0" />
                <span>{t('auth.success')}</span>
              </div>
              <p>{successMessage}</p>
            </div>
          )}

          {/* STATE 4: Token Verification Error Banner */}
          {tokenVerifyError && (
            <div className="p-4 rounded-md bg-[var(--bearish-bg)]/60 border border-[var(--bearish-border)]/80 text-[var(--bearish)] text-xs space-y-3 font-sans">
              <div className="flex items-center gap-2 font-semibold text-[var(--bearish)]">
                <AlertCircle className="w-4 h-4 text-[var(--bearish)] shrink-0" />
                <span>{t('auth.linkFailed')}</span>
              </div>
              <p>{tokenVerifyError}</p>
              <button
                type="button"
                onClick={() => {
                  setTokenVerifyError(null);
                  onNavigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg-section-alt)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-[11px] font-mono font-medium transition cursor-pointer"
              >
                <span>{t('auth.backToLogin')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* VIEW: Email Verification Pending View (After Register) */}
          {verificationPending ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-md bg-[var(--accent-subtle)]/90 border border-[var(--accent)]/60 flex items-center justify-center mx-auto text-[var(--accent)] mb-3 shadow-[var(--shadow-raised)]  relative">
                  <Mail className="w-7 h-7" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent)] rounded-full border-2 border-[var(--border-subtle)] flex items-center justify-center">
                    <Clock className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </span>
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
                  {t('auth.verify.title')}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  {t('auth.verify.desc')}
                </p>
                <div className="inline-block px-3 py-1.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--accent)] text-[var(--accent)] font-mono text-xs font-semibold">
                  {registeredEmail}
                </div>
              </div>

              {/* Form Input 6-Digit OTP Code */}
              <form onSubmit={handleVerifyOtp} className="p-4 rounded-md bg-[var(--bg-surface)] border border-[var(--accent)] space-y-3.5 shadow-[var(--shadow-overlay)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {t('auth.verify.codeLabel')}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--accent)]/80 bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent)]">
                    {t('Bebas Hambatan', 'Fast Track')}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                  {t('Masukkan 6 digit kode aktivasi dari email Anda di bawah ini:', 'Enter the 6-digit activation code sent to your email below:')}
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder={t('auth.verify.codePlaceholder')}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-3 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border-strong)] focus:border-[var(--accent)] rounded-md text-center font-mono text-base tracking-[0.25em] font-bold text-[var(--accent)] outline-none placeholder:text-[var(--text-muted)] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs transition"
                  />
                  <button
                    type="submit"
                    disabled={otpVerifying || otpCode.trim().length < 4}
                    className="px-4 py-2.5 rounded-md bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {otpVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{otpVerifying ? t('auth.verify.verifying') : t('auth.verify.submit')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-mono pt-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block shrink-0" />
                  <span>{t('Halaman ini otomatis masuk begitu tautan di email Anda dibuka.', 'This page updates automatically once you open the link in your email.')}</span>
                </div>
              </form>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => handleResendVerification()}
                  className="w-full py-2.5 rounded-md bg-[var(--bg-section-alt)] hover:bg-[var(--bg-section-alt)] border border-[var(--border-strong)] text-[var(--text-primary)] font-mono text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  <span>{resendLoading ? t('auth.verify.resending') : t('auth.verify.resend')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationPending(false);
                    onNavigate('/login');
                  }}
                  className="w-full py-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs transition cursor-pointer text-center"
                >
                  {t('auth.register.hasAccount')} {t('auth.register.loginLink')}
                </button>
              </div>
            </div>
          ) : isForgotPassword ? (
            /* VIEW: Forgot Password */
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent)]/80 flex items-center justify-center mx-auto text-[var(--accent)] mb-3 shadow-inner">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
                  {t('auth.forgot.title')}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  {t('auth.forgot.desc')}
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-md bg-[var(--bearish-bg)]/60 border border-[var(--bearish-border)]/80 text-[var(--bearish)] text-xs space-y-2 font-sans">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--bearish)]" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Instant Reset URL fallback */}
              {resetUrl && (
                <div className="p-3.5 rounded-md bg-[var(--accent-subtle)]/60 border border-[var(--accent)]/80 text-[var(--text-primary)] text-xs space-y-2">
                  <div className="font-mono text-[11px] font-bold text-[var(--accent)] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--warning)]" />
                    <span>{t('Tautan reset langsung siap digunakan', 'Instant reset link ready')}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {t('Gunakan tombol di bawah untuk langsung membuka formulir password baru:', 'Use the button below to open the new-password form directly:')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const match = resetUrl.match(/token=([^&]+)/);
                      if (match) {
                        setResetToken(decodeURIComponent(match[1]));
                      }
                      onNavigate(`/reset-password?token=${encodeURIComponent(resetToken || '')}`);
                    }}
                    className="w-full py-2 px-3 rounded-md bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{t('Buka formulir password baru', 'Open the new-password form')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[var(--text-secondary)] text-[11px] font-semibold">
                    {t('auth.login.email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.login.emailPlaceholder')}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full mt-2"
                >
                  {loading ? (
                    <span>{t('auth.forgot.submitting')}</span>
                  ) : (
                    <>
                      <span>{t('auth.forgot.submit')}</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-[var(--accent)] hover:underline font-mono text-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('auth.backToLogin')}</span>
                </button>
              </div>
            </div>
          ) : isResetPassword ? (
            /* VIEW: Reset Password (Set New Password) */
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent)]/80 flex items-center justify-center mx-auto text-[var(--accent)] mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
                  {t('auth.reset.title')}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  {t('auth.reset.desc')}
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-md bg-[var(--bearish-bg)]/60 border border-[var(--bearish-border)]/80 text-[var(--bearish)] text-xs space-y-2 font-sans">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--bearish)]" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4 font-mono text-xs">
                {!resetToken && (
                  <div className="p-3.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-sans leading-relaxed">
                    {t('auth.reset.noTokenWarning')}
                    <button
                      type="button"
                      onClick={() => onNavigate('/forgot-password')}
                      className="text-[var(--accent)] underline underline-offset-2"
                    >
                      {t('auth.reset.forgotLink')}
                    </button>
                    .
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[var(--text-secondary)] text-[11px] font-semibold">
                    {t('auth.reset.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[var(--text-secondary)] text-[11px] font-semibold">
                    {t('auth.reset.repeatPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full mt-2"
                >
                  {loading ? (
                    <span>{t('auth.reset.submitting')}</span>
                  ) : (
                    <>
                      <span>{t('auth.reset.submit')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs cursor-pointer"
                >
                  {t('auth.reset.cancel')}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW: Standard Login & Register */
            <>
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-md bg-[var(--accent-subtle)] border border-[var(--accent)]/80 flex items-center justify-center mx-auto text-[var(--accent)] mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
                  {isRegister ? t('auth.register.title') : t('auth.login.title')}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  {isRegister ? t('auth.register.desc') : t('auth.login.desc')}
                </p>
              </div>

              {/* Mode Tabs (Sign In vs Register) */}
              <div className="grid grid-cols-2 p-1 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className={`py-2 rounded-md font-semibold transition cursor-pointer ${
                    !isRegister
                      ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs border border-[var(--border-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  id="tab-login"
                >
                  {t('auth.login.tab')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className={`py-2 rounded-md font-semibold transition cursor-pointer ${
                    isRegister
                      ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs border border-[var(--border-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  id="tab-register"
                >
                  {t('auth.register.tab')}
                </button>
              </div>

              {/* Error Message Box with Intelligent Action Buttons */}
              {error && (
                <div className="p-3.5 rounded-md bg-[var(--bearish-bg)]/60 border border-[var(--bearish-border)]/80 text-[var(--bearish)] text-xs space-y-3 font-sans">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--bearish)]" />
                    <span className="leading-relaxed">{error}</span>
                  </div>

                  {/* Resolution Paths for Invalid Password */}
                  {errorCode === 'INVALID_PASSWORD' && (
                    <div className="pt-2 border-t border-[var(--bearish-border)]/60 space-y-2">
                      <p className="text-[11px] text-[var(--bearish)]/90 font-mono">{t('auth.invalidPasswordHelp')}</p>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            onNavigate(`/forgot-password?email=${encodeURIComponent(email.trim())}`);
                          }}
                          className="w-full py-2 px-3 rounded-md bg-[var(--bg-section-alt)] hover:bg-[var(--bg-section-alt)] text-[var(--accent)] border border-[var(--border-strong)] font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[var(--warning)]" />
                          <span>{t('auth.resetPasswordBtn')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resolution Paths for Unverified Email */}
                  {(errorCode === 'EMAIL_NOT_VERIFIED' || errorCode === 'ALREADY_REGISTERED_UNVERIFIED') && (
                    <div className="pt-2 border-t border-[var(--bearish-border)]/60 space-y-2.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider block">
                          {t('auth.otpLabel')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder={t('auth.otpPlaceholder')}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-2.5 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border-strong)] focus:border-[var(--accent)] rounded text-center font-mono text-sm tracking-widest font-bold text-[var(--accent)] outline-none placeholder:text-[var(--text-muted)] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyOtp()}
                            disabled={otpVerifying || otpCode.trim().length < 4}
                            className="px-3 py-1.5 rounded bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-bold font-mono text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          >
                            {otpVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            <span>{t('auth.activateBtn')}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--bearish-border)]/40">
                        <button
                          type="button"
                          onClick={() => {
                            setRegisteredEmail(email.trim());
                            setVerificationPending(true);
                          }}
                          className="text-[11px] text-[var(--accent)] hover:underline font-mono"
                        >
                          {t('auth.openFullActivation')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResendVerification(email || registeredEmail)}
                          disabled={resendLoading}
                          className="px-2.5 py-1 rounded bg-[var(--bearish-bg)]/50 hover:bg-[var(--bearish-bg)]/90 text-[var(--bearish)] text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                          id="unverified-resend-btn"
                        >
                          <Send className="w-3 h-3" />
                          <span>{resendLoading ? t('auth.resendingEmail') : t('auth.resendEmail')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resolution Path for User Not Found */}
                  {errorCode === 'USER_NOT_FOUND' && (
                    <div className="pt-2 border-t border-[var(--bearish-border)]/60">
                      <button
                        type="button"
                        onClick={() => onNavigate('/register')}
                        className="w-full py-1.5 px-3 rounded-md bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{t('auth.createAccountNow')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Resend Status Message */}
              {resendStatus && (
                <div className="p-3 rounded-md bg-[var(--bullish-bg)]/60 border border-[var(--bullish-border)]/80 text-[var(--bullish)] text-xs flex items-center gap-2 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-[var(--bullish)] shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* Standard Password Login / Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                  {isRegister && (
                    <div className="space-y-1.5">
                      <label className="block text-[var(--text-secondary)] text-[11px] font-semibold">
                        {t('auth.register.name')}
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
                        <Input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t('auth.register.namePlaceholder')}
                          className="pl-9 h-10"
                          id="auth-name-input"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[var(--text-secondary)] text-[11px] font-semibold">
                      {t('auth.login.email')}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.login.emailPlaceholder')}
                        className="pl-9 h-10"
                        id="auth-email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[var(--text-secondary)] text-[11px] font-semibold">
                        {t('auth.login.password')}
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/forgot-password?email=${encodeURIComponent(email.trim())}`)}
                          className="text-[11px] text-[var(--accent)] hover:underline font-mono cursor-pointer"
                        >
                          {t('auth.login.forgot')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        minLength={6}
                        className="pl-9 h-10"
                        id="auth-password-input"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full mt-2"
                    id="auth-submit-btn"
                  >
                    {loading ? (
                      <span>{t('auth.login.submitting')}</span>
                    ) : (
                      <>
                        <span>{isRegister ? t('auth.register.submit') : t('auth.login.submit')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>

                  {/* Google Firebase Authentication */}
                  <div className="space-y-3 pt-1">
                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-[var(--border-subtle)] w-full" />
                      <span className="px-3 text-[10px] uppercase font-mono tracking-widest text-[var(--text-muted)] shrink-0" style={{ background: 'var(--bg-surface)' }}>
                        {t('auth.login.orContinue')}
                      </span>
                      <div className="border-t border-[var(--border-subtle)] w-full" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading || googleLoading}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-section-alt)] text-[var(--text-primary)] text-xs font-semibold font-sans transition-all duration-150 disabled:opacity-50 cursor-pointer border border-[var(--border-strong)]"
                      id="google-signin-btn"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>{googleLoading ? t('auth.login.googleConnecting') : t('auth.login.google')}</span>
                    </button>
                  </div>
                </form>

              {/* Footer Links */}
              <div className="text-center text-[11px] text-[var(--text-secondary)] font-sans pt-2 border-t border-[var(--border-subtle)]">
                {isRegister ? (
                  <p>
                    {t('auth.register.hasAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                    >
                      {t('auth.register.loginLink')}
                    </button>
                  </p>
                ) : (
                  <p>
                    {t('auth.login.noAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/register')}
                      className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                    >
                      {t('auth.login.registerNow')}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
          </div>

          {/* Right Column: Open Area for 3D Robot Background Visual */}
          <div className="lg:col-span-6 xl:col-span-7 hidden lg:flex items-center justify-center relative w-full h-[600px] overflow-visible pointer-events-none" />

        </div>
      </main>

      {/* Bottom Disclaimer */}
      <footer className="py-4 text-center text-[10px] text-[var(--text-muted)] font-mono border-t border-[var(--border-subtle)]">
        {t('auth.footerDisclaimer')}
      </footer>
    </div>
  );
};
