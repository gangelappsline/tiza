import { ArrowLeft, Eye, EyeOff, KeyRound, LoaderCircle, LogOut, Mail, ShieldCheck, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import loginIllustration from '../assets/login-illustration.webp';
import Logo from '../components/ui/Logo';
import { getPanelPathForRole } from '../config';
import { useAuth } from '../context/auth-context';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authApi } from '../lib/api';
import { cn } from '../lib/utils';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'animate-fade-in-up rounded-xl border px-4 py-3 text-sm font-semibold',
        type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      {children}
    </div>
  );
}

function SubmitButton({ loading, loadingText, children, disabled }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="btn btn-lg w-full bg-[#2d5a3d] text-white shadow-lg shadow-emerald-900/20 hover:bg-[#234a31] enabled:hover:-translate-y-0.5"
    >
      {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
      {loading ? loadingText : children}
    </button>
  );
}

function TextField({ id, label, icon: Icon, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        <input id={id} className={cn('input py-3.5', Icon && 'pl-12')} {...props} />
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="input py-3.5 pr-12 pl-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function CodeInputs({ digits, onChange }) {
  const refs = useRef([]);

  const setDigit = (index, value) => {
    const next = [...digits];
    next[index] = value;
    onChange(next);
  };

  const handleChange = (index, raw) => {
    const value = raw.replace(/\D/g, '');
    if (value.length > 1) {
      // Autocompletado del sistema o pegado en una casilla: repartir los dígitos.
      const next = [...digits];
      value
        .slice(0, CODE_LENGTH - index)
        .split('')
        .forEach((d, i) => {
          next[index + i] = d;
        });
      onChange(next);
      refs.current[Math.min(index + value.length, CODE_LENGTH - 1)]?.focus();
      return;
    }
    setDigit(index, value);
    if (value && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const text = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    event.preventDefault();
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => text[i] ?? '');
    onChange(next);
    refs.current[Math.min(text.length, CODE_LENGTH) - 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Código de verificación de 6 dígitos">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={CODE_LENGTH}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoFocus={index === 0}
          aria-label={`Dígito ${index + 1}`}
          className={cn(
            'h-14 w-11 rounded-xl border-2 bg-white text-center font-display text-2xl font-bold text-slate-900 transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus:outline-none sm:h-16 sm:w-13',
            digit ? 'border-[#2d5a3d]' : 'border-slate-200',
          )}
        />
      ))}
    </div>
  );
}

function StepIndicator({ step }) {
  const steps = ['Correo', 'Código', 'Contraseña'];
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Pasos para recuperar la contraseña">
      {steps.map((label, i) => {
        const number = i + 1;
        const done = step > number;
        const current = step === number;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition',
                done && 'bg-emerald-500 text-white',
                current && 'bg-[#2d5a3d] text-white ring-4 ring-emerald-500/20',
                !done && !current && 'bg-slate-100 text-slate-400',
              )}
            >
              {done ? '✓' : number}
            </span>
            <span className={cn('hidden text-xs font-bold sm:inline', current ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
            {number < steps.length && <span className={cn('h-0.5 flex-1 rounded', done ? 'bg-emerald-400' : 'bg-slate-200')} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------------ */

function RecoveryFlow({ onDone }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const run = async (action, { successMessage, nextStep } = {}) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await action();
      if (successMessage) setSuccess(successMessage);
      if (nextStep) setStep(nextStep);
      return true;
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestCode = async (event) => {
    event?.preventDefault();
    const clean = email.trim();
    if (!EMAIL_PATTERN.test(clean)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    const ok = await run(() => authApi.requestPasswordCode(clean), {
      successMessage: 'Código enviado a tu correo. Revisa tu bandeja de entrada (y la carpeta de spam).',
      nextStep: 2,
    });
    if (ok) setCooldown(RESEND_SECONDS);
  };

  const verifyCode = (event) => {
    event.preventDefault();
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Por favor ingresa los 6 dígitos del código.');
      return;
    }
    run(() => authApi.verifyPasswordCode(email.trim(), code), {
      successMessage: 'Código verificado correctamente.',
      nextStep: 3,
    });
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    const ok = await run(() => authApi.resetPassword(email.trim(), digits.join(''), password), {
      successMessage: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
    });
    if (ok) setTimeout(onDone, 2200);
  };

  return (
    <div>
      <StepIndicator step={step} />
      <div className="space-y-5">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        {step === 1 && (
          <form onSubmit={requestCode} className="space-y-5" noValidate>
            <p className="text-sm text-slate-600">Ingresa tu correo electrónico y te enviaremos un código de verificación.</p>
            <TextField
              id={emailId}
              label="Correo Electrónico"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              autoFocus
              required
            />
            <SubmitButton loading={loading} loadingText="Enviando…">
              Enviar Código
            </SubmitButton>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyCode} className="space-y-5" noValidate>
            <p className="text-center text-sm text-slate-600">
              Ingresa el código de 6 dígitos que enviamos a <strong className="text-slate-900">{email.trim()}</strong>
            </p>
            <CodeInputs digits={digits} onChange={setDigits} />
            <SubmitButton loading={loading} loadingText="Verificando…">
              Verificar Código
            </SubmitButton>
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="font-bold text-slate-500 hover:text-slate-800" onClick={() => setStep(1)}>
                ← Cambiar correo
              </button>
              <button
                type="button"
                className="font-bold text-sky-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                onClick={() => requestCode()}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="space-y-5" noValidate>
            <p className="text-sm text-slate-600">Crea tu nueva contraseña.</p>
            <PasswordField
              id={passwordId}
              label="Nueva Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
            <PasswordField
              id={confirmId}
              label="Confirmar Contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
            />
            <SubmitButton loading={loading} loadingText="Actualizando…" disabled={Boolean(success)}>
              Restablecer Contraseña
            </SubmitButton>
          </form>
        )}

        <div className="text-center">
          <button type="button" className="text-sm font-bold text-sky-600 hover:underline" onClick={onDone}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const identifierId = useId();
  const passwordId = useId();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Ingresa tu correo o usuario y tu contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      const from = location.state?.from?.pathname;
      navigate(from || getPanelPathForRole(user.role) || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'No pudimos iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Alert>{error}</Alert>
      <TextField
        id={identifierId}
        label="Correo o Usuario"
        icon={User}
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Ingresa tu correo o usuario"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
      />
      <PasswordField
        id={passwordId}
        label="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="Ingresa tu contraseña"
      />
      <SubmitButton loading={loading} loadingText="Iniciando sesión…">
        Iniciar Sesión
      </SubmitButton>
    </form>
  );
}

function AlreadySignedIn() {
  const { user, logout } = useAuth();
  const panel = getPanelPathForRole(user.role);
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl" aria-hidden="true">
        👋
      </div>
      <p className="text-slate-600">
        Ya iniciaste sesión como <strong className="text-slate-900">{user.username || user.email || 'usuario'}</strong>.
      </p>
      <div className="flex flex-col gap-3">
        <Link to={panel || '/'} className="btn btn-lg bg-[#2d5a3d] text-white hover:bg-[#234a31]">
          {panel ? 'Ir a mi panel' : 'Ir a la biblioteca'}
        </Link>
        <button type="button" onClick={logout} className="btn btn-md btn-ghost">
          <LogOut className="size-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  useDocumentTitle('Iniciar sesión', 'Inicia sesión en Tiza para acceder a tu panel de maestro o administrador.');
  const { user } = useAuth();
  const [mode, setMode] = useState('login');

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Ilustración */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-10">
        <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative w-full max-w-md">
          <img
            src={loginIllustration}
            alt="Dos niños aprendiendo frente a un pizarrón rodeados de planetas, estrellas y letras"
            width="640"
            height="1147"
            className="animate-float-slow mx-auto max-h-[68vh] w-auto rounded-[2rem] object-contain shadow-2xl shadow-emerald-900/20 ring-8 ring-white/70"
          />
          <ul className="mt-8 grid gap-3 text-sm font-bold text-slate-700">
            {[
              ['🎯', 'Actividades interactivas de matemáticas y español'],
              ['📊', 'Seguimiento del progreso de tus grupos'],
              ['🚀', 'Juegos que hacen divertido aprender'],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <span className="text-xl" aria-hidden="true">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col bg-white px-5 py-8 sm:px-10">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
          <Logo className="mb-8 self-center" imgClassName="h-20" />
          <div className="mb-8 text-center">
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
              {mode === 'recovery' ? 'Recuperar Contraseña' : 'Comienza tu aventura de aprendizaje'}
            </h1>
            {mode === 'login' && !user && <p className="mt-2 text-slate-500">Inicia sesión con tu cuenta de Tiza</p>}
          </div>

          {user && mode === 'login' ? (
            <AlreadySignedIn />
          ) : mode === 'recovery' ? (
            <RecoveryFlow onDone={() => setMode('login')} />
          ) : (
            <>
              <LoginForm />
              <div className="mt-5 text-center">
                <button type="button" className="text-sm font-bold text-sky-600 hover:underline" onClick={() => setMode('recovery')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <p className="mt-8 flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden="true" />
                Las cuentas son para maestros y administradores. Los estudiantes pueden jugar en la biblioteca sin
                iniciar sesión.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
