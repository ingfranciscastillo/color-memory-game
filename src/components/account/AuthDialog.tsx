import { useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { authClient } from "@/lib/auth-client";
import { loadAuthProviders, type SocialProvider } from "@/lib/auth-providers";
import { CaptchaError, useTurnstile } from "@/lib/turnstile";
import { m } from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

/** Dialog steps: email → code, or the password path. */
type Step = "email" | "code" | "password";
type PasswordMode = "sign-in" | "sign-up" | "forgot";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

/** Discord logo (simple-icons, CC0). */
const DISCORD_PATH =
	"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z";

const PROVIDERS: Record<SocialProvider, { label: () => string; path: string }> =
	{
		discord: { label: m.auth_discord, path: DISCORD_PATH },
	};

const INPUT =
	"w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted transition-colors focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink focus-visible:outline-none disabled:opacity-60";
const LABEL = "text-xs text-ink-muted";
const LINK =
	"text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-45 disabled:hover:no-underline";
const PRIMARY =
	"w-full rounded-xl bg-ink px-8 py-4 font-semibold text-paper transition-opacity hover:opacity-80 disabled:opacity-60";

interface AuthDialogProps {
	open: boolean;
	onClose: () => void;
}

/** Errors from Better Auth's captcha plugin (token missing or rejected). */
function isCaptchaError(error: { code?: string }) {
	return (
		error.code === "VERIFICATION_FAILED" ||
		error.code === "MISSING_RESPONSE" ||
		error.code === "UNKNOWN_ERROR"
	);
}

/**
 * 6-digit code shown as six cells; each digit pops into its cell. Under them
 * is a single real input (numeric keyboard, OS autofill, paste).
 */
function CodeCells({
	id,
	value,
	onChange,
	disabled,
	describedBy,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	disabled: boolean;
	describedBy: string;
}) {
	const [focused, setFocused] = useState(false);
	const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");

	return (
		<div className="relative">
			<input
				id={id}
				// biome-ignore lint/a11y/noAutofocus: typing the code is all this step is for.
				autoFocus
				data-autofocus
				inputMode="numeric"
				autoComplete="one-time-code"
				pattern="[0-9]*"
				maxLength={CODE_LENGTH}
				disabled={disabled}
				aria-describedby={describedBy}
				value={value}
				onChange={(event) =>
					onChange(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
				}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				className="absolute inset-0 z-10 w-full cursor-text opacity-0"
			/>
			<div className="flex gap-2" aria-hidden="true">
				{digits.map((digit, index) => {
					const active =
						focused &&
						(index === value.length ||
							(value.length === CODE_LENGTH && index === CODE_LENGTH - 1));
					return (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed code positions.
							key={index}
							className={`flex aspect-square flex-1 items-center justify-center rounded-lg border bg-paper text-2xl font-semibold tabular-nums transition-colors ${
								active ? "border-foreground" : "border-input"
							}`}
						>
							{digit && (
								<span key={digit} className="animate-pop-in">
									{digit}
								</span>
							)}
						</span>
					);
				})}
			</div>
		</div>
	);
}

/**
 * Sign in or create an account. Fastest first (Discord); below, passwordless
 * email: we send a 6-digit code. Password is one click away for whoever
 * prefers it.
 */
export function AuthDialog({ open, onClose }: AuthDialogProps) {
	const ids = useId();
	const emailId = `${ids}-email`;
	const codeId = `${ids}-code`;
	const codeHintId = `${ids}-code-hint`;
	const errorId = `${ids}-error`;

	const [providers, setProviders] = useState<SocialProvider[]>([]);
	const [step, setStep] = useState<Step>("email");
	const [mode, setMode] = useState<PasswordMode>("sign-in");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [resendIn, setResendIn] = useState(0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const submittedCode = useRef("");
	const captcha = useTurnstile(open);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		void loadAuthProviders().then((list) => {
			if (!cancelled) setProviders(list);
		});
		return () => {
			cancelled = true;
		};
	}, [open]);

	// On close, the dialog returns to the first step (the email is kept).
	useEffect(() => {
		if (open) return;
		setStep("email");
		setMode("sign-in");
		setPassword("");
		setShowPassword(false);
		setCode("");
		setError(null);
		setNotice(null);
		submittedCode.current = "";
	}, [open]);

	// Countdown before the code can be resent.
	useEffect(() => {
		if (resendIn <= 0) return;
		const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
		return () => clearTimeout(timer);
	}, [resendIn]);

	const goTo = (next: Step) => {
		setStep(next);
		setError(null);
		setNotice(null);
	};

	const switchMode = (next: PasswordMode) => {
		setMode(next);
		setError(null);
		setNotice(null);
	};

	const run = async (action: () => Promise<string | null>) => {
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			const problem = await action();
			if (problem) setError(problem);
		} catch (thrown) {
			setError(
				thrown instanceof CaptchaError
					? m.auth_error_captcha()
					: m.auth_error_network(),
			);
		} finally {
			setBusy(false);
		}
	};

	const social = (provider: SocialProvider) =>
		run(async () => {
			const { error } = await authClient.signIn.social({
				provider,
				callbackURL: window.location.pathname,
			});
			return error ? m.auth_error_social() : null;
		});

	const sendCode = () =>
		run(async () => {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "sign-in",
				fetchOptions: await captcha.getHeaders(),
			});
			if (error) {
				if (isCaptchaError(error)) return m.auth_error_captcha();
				return error.status === 429
					? m.auth_error_too_many_codes()
					: m.auth_error_send_code();
			}
			setCode("");
			submittedCode.current = "";
			setResendIn(RESEND_SECONDS);
			setStep("code");
			return null;
		});

	const verifyCode = (otp: string) =>
		run(async () => {
			const { error } = await authClient.signIn.emailOtp({ email, otp });
			if (error) {
				setCode("");
				return m.auth_error_code();
			}
			onClose();
			return null;
		});

	// With all 6 digits the code submits itself (once per code).
	const updateCode = (value: string) => {
		setCode(value);
		setError(null);
		if (value.length === CODE_LENGTH && submittedCode.current !== value) {
			submittedCode.current = value;
			void verifyCode(value);
		}
	};

	const passwordSubmit = () =>
		run(async () => {
			const callbackURL = window.location.pathname;
			if (mode === "forgot") {
				const { error } = await authClient.requestPasswordReset({
					email,
					redirectTo: localizeHref("/reset-password"),
					fetchOptions: await captcha.getHeaders(),
				});
				if (error && isCaptchaError(error)) return m.auth_error_captcha();
				if (error) return m.auth_error_reset_send();
				setNotice(m.auth_notice_reset({ email }));
				return null;
			}
			if (mode === "sign-up") {
				const { error } = await authClient.signUp.email({
					name: name.trim(),
					email,
					password,
					callbackURL,
					fetchOptions: await captcha.getHeaders(),
				});
				if (error) {
					if (isCaptchaError(error)) return m.auth_error_captcha();
					return error.status === 422
						? m.auth_error_exists()
						: m.auth_error_sign_up();
				}
				setNotice(m.auth_notice_verify({ email }));
				return null;
			}
			const { error } = await authClient.signIn.email({
				email,
				password,
				callbackURL,
				fetchOptions: await captcha.getHeaders(),
			});
			if (error) {
				if (isCaptchaError(error)) return m.auth_error_captcha();
				return error.status === 403
					? m.auth_error_unverified({ email })
					: m.auth_error_credentials();
			}
			onClose();
			return null;
		});

	const title =
		step === "password" && mode === "sign-up"
			? m.auth_title_sign_up()
			: step === "password" && mode === "forgot"
				? m.auth_title_forgot()
				: m.auth_title();

	const errorMessage = error && (
		<p id={errorId} role="alert" className="text-sm text-destructive">
			{error}
		</p>
	);

	return (
		<Modal open={open} onClose={onClose} title={title}>
			{/* key: each step enters with a short fade. */}
			<div key={`${step}-${mode}`} className="animate-step-in space-y-6">
				{step === "email" && (
					<>
						<p className="text-sm text-ink-muted">{m.auth_intro()}</p>

						{providers.length > 0 && (
							<div className="space-y-4">
								{providers.map((provider) => (
									<button
										key={provider}
										type="button"
										disabled={busy}
										onClick={() => social(provider)}
										className="flex w-full items-center justify-center gap-3 border border-input px-8 py-4 text-sm font-semibold transition-colors hover:border-foreground disabled:opacity-60"
									>
										<svg
											viewBox="0 0 24 24"
											width="16"
											height="16"
											aria-hidden="true"
										>
											<path d={PROVIDERS[provider].path} fill="currentColor" />
										</svg>
										{PROVIDERS[provider].label()}
									</button>
								))}
								<div
									className="flex items-center gap-4 text-xs text-ink-muted"
									aria-hidden="true"
								>
									<span className="h-px flex-1 bg-border" />
									{m.auth_or_email()}
									<span className="h-px flex-1 bg-border" />
								</div>
							</div>
						)}

						<form
							className="space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								void sendCode();
							}}
						>
							<div className="space-y-2">
								<label htmlFor={emailId} className={LABEL}>
									{m.auth_email()}
								</label>
								<input
									id={emailId}
									type="email"
									required
									// biome-ignore lint/a11y/noAutofocus: it's the only field in this step.
									autoFocus
									data-autofocus
									autoComplete="email"
									placeholder={m.auth_email_placeholder()}
									aria-describedby={error ? errorId : undefined}
									className={INPUT}
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
							</div>
							{errorMessage}
							<button
								type="submit"
								className={PRIMARY}
								disabled={busy}
								aria-busy={busy}
							>
								{busy ? m.auth_sending() : m.auth_send_code()}
							</button>
						</form>

						<button
							type="button"
							className={LINK}
							onClick={() => goTo("password")}
						>
							{m.auth_use_password()}
						</button>

						<p className="text-xs text-ink-muted">{m.auth_age_notice()}</p>
					</>
				)}

				{step === "code" && (
					<>
						<p id={codeHintId} className="text-sm text-ink-muted">
							{m.auth_code_hint({ email })}
						</p>

						<div>
							<label htmlFor={codeId} className="sr-only">
								{m.auth_code_label()}
							</label>
							<CodeCells
								id={codeId}
								value={code}
								onChange={updateCode}
								disabled={busy}
								describedBy={error ? `${codeHintId} ${errorId}` : codeHintId}
							/>
						</div>
						{errorMessage}
						{busy && (
							<p role="status" className="text-sm text-ink-muted">
								{m.auth_checking()}
							</p>
						)}

						<div className="flex flex-wrap items-center justify-between gap-4">
							<button
								type="button"
								className={LINK}
								onClick={() => goTo("email")}
							>
								{m.auth_change_email()}
							</button>
							<button
								type="button"
								className={`${LINK} tabular-nums`}
								disabled={busy || resendIn > 0}
								onClick={() => void sendCode()}
							>
								{resendIn > 0
									? m.auth_resend_in({ seconds: resendIn })
									: m.auth_resend()}
							</button>
						</div>
					</>
				)}

				{step === "password" && (
					<>
						<form
							className="space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								void passwordSubmit();
							}}
						>
							{mode === "sign-up" && (
								<div className="space-y-2">
									<label htmlFor={`${ids}-name`} className={LABEL}>
										{m.auth_name()}
									</label>
									<input
										id={`${ids}-name`}
										required
										minLength={2}
										maxLength={24}
										// biome-ignore lint/a11y/noAutofocus: first field of the step.
										autoFocus
										data-autofocus
										autoComplete="nickname"
										className={INPUT}
										value={name}
										onChange={(event) => setName(event.target.value)}
									/>
								</div>
							)}
							<div className="space-y-2">
								<label htmlFor={emailId} className={LABEL}>
									{m.auth_email()}
								</label>
								<input
									id={emailId}
									type="email"
									required
									// biome-ignore lint/a11y/noAutofocus: first field of the step.
									autoFocus={mode !== "sign-up"}
									data-autofocus={mode !== "sign-up" || undefined}
									autoComplete="email"
									className={INPUT}
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
							</div>
							{mode !== "forgot" && (
								<div className="space-y-2">
									<div className="flex items-baseline justify-between gap-4">
										<label htmlFor={`${ids}-password`} className={LABEL}>
											{m.auth_password()}
										</label>
										{mode === "sign-in" && (
											<button
												type="button"
												className={LINK}
												onClick={() => switchMode("forgot")}
											>
												{m.auth_forgot()}
											</button>
										)}
									</div>
									<div className="relative">
										<input
											id={`${ids}-password`}
											type={showPassword ? "text" : "password"}
											required
											minLength={8}
											autoComplete={
												mode === "sign-up" ? "new-password" : "current-password"
											}
											className={`${INPUT} pr-24`}
											value={password}
											onChange={(event) => setPassword(event.target.value)}
										/>
										<button
											type="button"
											className="absolute inset-y-0 right-0 px-4 text-xs text-ink-muted transition-colors hover:text-ink"
											aria-label={
												showPassword
													? m.auth_hide_password()
													: m.auth_show_password()
											}
											aria-pressed={showPassword}
											onClick={() => setShowPassword((value) => !value)}
										>
											{showPassword ? m.auth_hide() : m.auth_show()}
										</button>
									</div>
									{mode === "sign-up" && (
										<p className="text-xs text-ink-muted">
											{m.auth_password_min()}
										</p>
									)}
								</div>
							)}
							{errorMessage}
							<button
								type="submit"
								className={PRIMARY}
								disabled={busy}
								aria-busy={busy}
							>
								{busy
									? m.auth_wait()
									: mode === "sign-in"
										? m.auth_submit_sign_in()
										: mode === "sign-up"
											? m.auth_submit_sign_up()
											: m.auth_submit_forgot()}
							</button>
						</form>

						{notice && (
							<p role="status" className="text-sm">
								{notice}
							</p>
						)}

						<div className="flex flex-wrap items-center justify-between gap-4">
							<button
								type="button"
								className={LINK}
								onClick={() => goTo("email")}
							>
								{m.auth_without_password()}
							</button>
							<button
								type="button"
								className={LINK}
								onClick={() =>
									switchMode(mode === "sign-in" ? "sign-up" : "sign-in")
								}
							>
								{mode === "sign-in"
									? m.auth_create_account()
									: m.auth_have_account()}
							</button>
						</div>
					</>
				)}
			</div>
			{/* Turnstile: invisible unless Cloudflare asks for a check. */}
			<div ref={captcha.containerRef} className="mt-6 empty:hidden" />
		</Modal>
	);
}
