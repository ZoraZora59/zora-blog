import chalk from "chalk";
import Table from "cli-table3";

export function printTable(rows: Array<Record<string, unknown>>, columns?: string[]): void {
  if (rows.length === 0) {
    console.log(chalk.dim("(空)"));
    return;
  }
  const head = columns ?? Object.keys(rows[0]!);
  const table = new Table({
    head: head.map((h) => chalk.bold(h)),
    style: { head: [], border: ["grey"] },
  });
  for (const row of rows) {
    table.push(head.map((h) => formatCell(row[h])));
  }
  console.log(table.toString());
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim("—");
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/** `--json` 或 `--json FIELDS` 的输出 */
export function printJson(value: unknown, fields?: string[]): void {
  if (!fields || fields.length === 0) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  const pick = (obj: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const f of fields) out[f] = obj[f];
    return out;
  };
  if (Array.isArray(value)) {
    console.log(JSON.stringify(value.map((v) => pick(v as Record<string, unknown>)), null, 2));
  } else if (value && typeof value === "object") {
    console.log(JSON.stringify(pick(value as Record<string, unknown>), null, 2));
  } else {
    console.log(JSON.stringify(value));
  }
}

export function success(msg: string): void {
  console.log(chalk.green("✓") + " " + msg);
}

export function warn(msg: string): void {
  console.error(chalk.yellow("!") + " " + msg);
}

export function error(msg: string): void {
  console.error(chalk.red("✗") + " " + msg);
}

export function info(msg: string): void {
  console.log(chalk.blue("→") + " " + msg);
}

export function parseJsonFields(value: string | boolean | undefined): string[] | undefined {
  if (value === undefined || value === false) return undefined;
  if (value === true) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
