import { readFile } from "node:fs/promises";
import path from "node:path";
import { MailError, isEnoent, toError } from "./errors.js";

const TEMPLATE_NAME = /^[\w-]+$/;

export function renderTemplate(
  html: string,
  variables: Record<string, string>,
): string {
  return html.replaceAll(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const replacement = Object.hasOwn(variables, key)
      ? variables[key]
      : undefined;
    return replacement === undefined ? match : replacement;
  });
}

export async function loadTemplate(
  templatesDir: string,
  name: string,
): Promise<string> {
  if (!TEMPLATE_NAME.test(name)) {
    throw new MailError(`Invalid template name: ${name}`);
  }

  const file = path.join(templatesDir, `${name}.html`);

  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (isEnoent(error)) {
      throw new MailError(`Template not found: ${name}`);
    }

    throw new MailError("Failed to read template", { cause: toError(error) });
  }
}
