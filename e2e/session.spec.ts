import { test, expect, type Page } from "@playwright/test";
async function setup(page: Page) {
  await page.goto("/");
  for (const [i, name] of ["Dat", "Alex", "John", "Tom"].entries())
    await page.locator(`#name-${i}`).fill(name);
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.getByText("LIVE GAME", { exact: true })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
}
test("complete €160 game survives refresh, settles, stores history and rematches", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await setup(page);
  await noOverflow(page);
  for (const name of ["Dat", "Alex", "Alex", "Tom"])
    await page
      .getByRole("button", { name: `Add one buy-in to ${name}`, exact: true })
      .click();
  await expect(page.locator(".money-stat strong")).toHaveText("€160.00");
  await page.reload();
  await expect(
    page.getByText("GAME IN PROGRESS", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue game" }).click();
  await expect(page.locator(".money-stat strong")).toHaveText("€160.00");
  await page.getByRole("button", { name: "End game", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End game", exact: true })
    .click();
  for (const [name, chips] of [
    ["Dat", "60000"],
    ["Alex", "30000"],
    ["John", "50000"],
    ["Tom", "20000"],
  ])
    await page
      .getByRole("textbox", { name: `${name} final chips` })
      .fill(chips);
  await expect(page.getByText("All chips accounted for")).toBeVisible();
  await noOverflow(page);
  await page.reload();
  await page.getByRole("button", { name: "Continue game" }).click();
  await expect(
    page.getByRole("textbox", { name: "Dat final chips" }),
  ).toHaveValue("60,000");
  await page.getByRole("button", { name: "Calculate results" }).click();
  const rows = page.locator(".result-row");
  await expect(rows.first()).toContainText("John");
  await expect(rows.first()).toContainText("+€30.00");
  await expect(rows.last()).toContainText("Alex");
  await expect(rows.last()).toContainText("-€30.00");
  await expect(page.locator(".payment-row")).toHaveCount(2);
  await noOverflow(page);
  await page.screenshot({
    path: `test-results/${test.info().project.name}-results.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.locator(".history-card")).toHaveCount(1);
  await page.getByRole("button", { name: "View results" }).click();
  await page.getByRole("button", { name: "Rematch", exact: true }).click();
  await expect(page.locator(".money-stat strong")).toHaveText("€80.00");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.locator(".history-card")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("half rebuys, undo, removal confirmation, mismatch, history deletion and settings", async ({
  page,
}) => {
  await setup(page);
  const dat = page
    .locator(".player-card")
    .filter({ has: page.getByRole("heading", { name: "Dat", exact: true }) });
  await dat.getByRole("button", { name: "Add rebuy", exact: true }).click();
  await page.getByLabel("Additional buy-ins").fill("0.5");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add rebuy", exact: true })
    .click();
  await expect(dat.locator(".buyin-row strong")).toHaveText("1.5");
  await expect(
    dat.getByRole("button", { name: "Remove one buy-in from Dat" }),
  ).toBeDisabled();
  await dat.locator("summary").click();
  await dat.getByRole("button", { name: "Undo latest action" }).click();
  await expect(dat.locator(".buyin-row strong")).toHaveText("1");
  await page.getByRole("button", { name: "Add one buy-in to Dat" }).click();
  await page
    .getByRole("button", { name: "Remove one buy-in from Dat" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remove buy-in", exact: true })
    .click();
  await expect(dat.locator(".buyin-row strong")).toHaveText("1");
  await page.getByRole("button", { name: "End game", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End game", exact: true })
    .click();
  for (const name of ["Dat", "Alex", "John", "Tom"])
    await page
      .getByRole("textbox", { name: `${name} final chips` })
      .fill(name === "Dat" ? "0" : "20000");
  await expect(
    page.getByText(
      "20,000 chips are missing. Check the counts before continuing.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Calculate results" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Calculate anyway", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Calculate anyway", exact: true })
    .click();
  await expect(page.getByText("This session is unbalanced")).toBeVisible();
  await expect(page.locator(".payments")).toHaveCount(0);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await noOverflow(page);
  await page.getByRole("link", { name: "History", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.locator(".history-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete all history", exact: true })
    .click();
  await expect(page.getByText("A clean slate.")).toBeVisible();
});
test("setup rejects duplicate names and supports 20 players without overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("spinbutton", { name: "Number of players" }).fill("20");
  await expect(page.locator(".names-grid input")).toHaveCount(20);
  await noOverflow(page);
  await page.getByRole("spinbutton", { name: "Number of players" }).fill("2");
  await page.locator("#name-0").fill("Dat");
  await page.locator("#name-1").fill(" dat ");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toHaveText(
    "Each player needs a unique name.",
  );
  await page.locator("#name-1").fill("Alex");
  await page.locator("#buy-in").fill("12.50");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator(".money-stat strong")).toHaveText("€25.00");
});
test("offline reload recovers the active table", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not expose service worker support.",
  );
  await setup(page);
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const urls = performance.getEntriesByType("resource").map((r) => r.name);
    reg.active?.postMessage({ type: "CACHE_ASSETS", urls });
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cache = await caches.open("pokerstack-shell-v1");
        return (await cache.keys()).filter(
          (r) => r.url.includes("/_next/static/") && r.url.endsWith(".js"),
        ).length;
      }),
    )
    .toBeGreaterThan(2);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Continue game" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue game" }).click();
  await page.getByRole("button", { name: "Add one buy-in to Dat" }).click();
  await expect(page.locator(".money-stat strong")).toHaveText("€100.00");
});
