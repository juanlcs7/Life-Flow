const AUTH_ERROR_MESSAGES: Array<[string, string]> = [
  ["invalid login credentials", "E-mail ou senha incorretos."],
  ["email not confirmed", "Confirme seu e-mail antes de entrar."],
  ["user already registered", "Este e-mail já está cadastrado. Tente entrar."],
  ["email rate limit exceeded", "Muitos e-mails foram solicitados. Aguarde alguns minutos e tente novamente."],
  ["rate limit", "Muitas tentativas em pouco tempo. Aguarde alguns minutos."],
  ["password should be", "A senha não atende aos requisitos de segurança."],
  ["signup is disabled", "A criação de novas contas está temporariamente indisponível."],
  ["network", "Não foi possível conectar. Verifique sua internet e tente novamente."],
  ["same password", "A nova senha deve ser diferente da senha atual."],
];

export function translateAuthError(error: unknown, fallback = "Tente novamente em alguns instantes.") {
  const raw = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "";
  const normalized = raw.toLowerCase();
  return AUTH_ERROR_MESSAGES.find(([fragment]) => normalized.includes(fragment))?.[1] ?? fallback;
}
