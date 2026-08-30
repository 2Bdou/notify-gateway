import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("cloudflare deploy wiring", () => {
  it("keeps placeholder resource IDs so the deploy button can provision them", () => {
    const toml = readFileSync(join(root, "wrangler.toml"), "utf8");
    expect(toml).toMatch(/id = "00000000000000000000000000000001"/);
    expect(toml).toMatch(/database_id = "00000000000000000000000000000002"/);
    expect(toml).toMatch(/migrations_dir = "migrations"/);
    expect(toml).toMatch(/binding = "NOTIFY_KV"/);
    expect(toml).toMatch(/binding = "DB"/);
  });

  it("applies D1 migrations by binding name in deploy scripts", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      cloudflare: { bindings: Record<string, { description: string }> };
    };
    expect(pkg.scripts.deploy).toContain("db:migrate");
    expect(pkg.scripts["db:migrate"]).toBe("wrangler d1 migrations apply notify-tasks --remote");
    expect(pkg.cloudflare.bindings.JWT_SECRET.description).toBeTruthy();
    expect(pkg.cloudflare.bindings.KEY_HMAC_SECRET.description).toBeTruthy();
  });

  it("ships a GitHub Actions deploy workflow", () => {
    const yml = readFileSync(join(root, ".github/workflows/deploy.yml"), "utf8");
    expect(yml).toContain("cloudflare/wrangler-action@v3");
    expect(yml).toContain("ensure-cf-resources.mjs");
    expect(yml).toContain("migrations apply notify-tasks --remote");
    expect(yml).not.toContain("--yes");
    expect(yml).toContain("JWT_SECRET");
    expect(yml).toContain("KEY_HMAC_SECRET");
  });
});
