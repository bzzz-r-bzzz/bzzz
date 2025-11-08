import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

/**
 * Ensures that src/lib/text-gen-models.ts exists.
 * If it doesn't exist, runs the get-text-gen-models.sh script to generate it.
 *
 * This is called automatically by vite configs before building/serving.
 */
export function ensureTextGenModels() {
  const textGenModelsPath = resolve(
    process.cwd(),
    "src/lib/text-gen-models.ts",
  );

  if (!existsSync(textGenModelsPath)) {
    console.log("📝 Generating src/lib/text-gen-models.ts...");
    try {
      execSync("bash ./scripts/get-text-gen-models.sh", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("✅ Successfully generated src/lib/text-gen-models.ts");
    } catch (error) {
      console.warn("⚠️  Failed to generate src/lib/text-gen-models.ts");
      console.warn(
        "   You may need to run: bash ./scripts/get-text-gen-models.sh",
      );
      console.warn("   Or ensure wrangler is authenticated: wrangler login");
      // Don't throw - let the build continue, it might not need this file
    }
  }
}
