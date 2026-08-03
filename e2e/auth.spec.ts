import { expect, test } from "@playwright/test";

test("abre recuperação de senha sem revelar se a conta existe", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(page.getByRole("heading", { name: "Recuperar acesso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar link" })).toBeVisible();
});

test("valida os dados antes de criar uma conta", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: /Criar conta grátis/ }).click();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByText("Email inválido")).toBeVisible();
  await expect(page.getByText("A senha deve ter pelo menos 6 caracteres")).toBeVisible();
});

test("conta de teste consegue entrar e abrir finanças", async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, "Defina credenciais exclusivas de teste");
  await page.goto("/auth");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Entrar no LifeFlow" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/financas");
  await expect(page.getByRole("heading", { name: "Finanças" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nova Transação" })).toBeVisible();
});
