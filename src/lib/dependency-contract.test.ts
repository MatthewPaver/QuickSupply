import { createRequire } from "node:module";
import path from "node:path";
import { expect, it } from "vitest";

const require = createRequire(path.join(process.cwd(), "package.json"));
const nextRequire = createRequire(require.resolve("next/package.json"));

it("Next resolves the reviewed patched Sharp and PostCSS versions", () => {
  expect(nextRequire("sharp").versions.sharp).toBe("0.35.0");
  expect(nextRequire("postcss/package.json").version).toBe("8.5.28");
});

it("the patched image dependency still resizes and encodes an image", async () => {
  const sharp = nextRequire("sharp");
  const image = await sharp({ create: { width: 12, height: 8, channels: 3, background: "#ffffff" } })
    .resize(6, 4).webp().toBuffer();
  const metadata = await sharp(image).metadata();
  expect(metadata).toMatchObject({ width: 6, height: 4, format: "webp" });
});

it("the patched CSS dependency parses and emits stylesheet rules", () => {
  const css = nextRequire("postcss").parse(".demo { color: red; }");
  expect(css.nodes[0].selector).toBe(".demo");
  expect(css.toString()).toContain("color: red");
});
