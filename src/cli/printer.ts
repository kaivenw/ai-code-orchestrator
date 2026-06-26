import chalk from "chalk";

/** Thin wrapper around console with consistent, colorized prefixes. */
export const printer = {
  info(msg: string): void {
    console.log(msg);
  },
  step(msg: string): void {
    console.log(chalk.cyan("›"), msg);
  },
  success(msg: string): void {
    console.log(chalk.green("✔"), msg);
  },
  warn(msg: string): void {
    console.log(chalk.yellow("⚠"), msg);
  },
  error(msg: string): void {
    console.log(chalk.red("✖"), msg);
  },
  switchNotice(from: string, to: string, reason: string): void {
    console.log(chalk.yellow(`↻ Primary engine "${from}" failed: ${reason}`));
    console.log(chalk.yellow(`↻ Switching to fallback engine "${to}"`));
  },
  heading(msg: string): void {
    console.log("\n" + chalk.bold(msg));
  },
  kv(key: string, value: string): void {
    console.log(`${chalk.dim(key + ":")} ${value}`);
  },
  dim(msg: string): void {
    console.log(chalk.dim(msg));
  },
};
