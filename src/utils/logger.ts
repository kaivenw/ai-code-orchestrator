import fs from "fs-extra";
import path from "node:path";
import { nowIso } from "./time.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LoggerOptions {
  /** Directory where log files are written. */
  directory: string;
  /** Run id used to namespace files. */
  runId: string;
  /** Minimum level to emit. */
  level?: LogLevel;
  /** Also echo structured lines to stderr (off by default; CLI uses printer). */
  echo?: boolean;
}

export interface LogFields {
  engine?: string;
  step_id?: string;
  [key: string]: unknown;
}

/**
 * File-based structured logger. One JSON line per record. Raw engine output is
 * appended verbatim to the main run log so nothing is ever swallowed.
 */
export class Logger {
  private readonly dir: string;
  private readonly runId: string;
  private readonly level: LogLevel;
  private readonly echo: boolean;
  readonly mainLogFile: string;
  readonly errorLogFile: string;

  constructor(opts: LoggerOptions) {
    this.dir = opts.directory;
    this.runId = opts.runId;
    this.level = opts.level ?? "info";
    this.echo = opts.echo ?? false;
    fs.ensureDirSync(this.dir);
    this.mainLogFile = path.join(this.dir, `${this.runId}.log`);
    this.errorLogFile = path.join(this.dir, `${this.runId}.error.log`);
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.level];
  }

  log(level: LogLevel, message: string, fields: LogFields = {}): void {
    if (!this.shouldLog(level)) return;
    const record = {
      time: nowIso(),
      level,
      run_id: this.runId,
      ...fields,
      message,
    };
    const line = JSON.stringify(record) + "\n";
    fs.appendFileSync(this.mainLogFile, line);
    if (level === "error") fs.appendFileSync(this.errorLogFile, line);
    if (this.echo) process.stderr.write(line);
  }

  debug(message: string, fields?: LogFields): void {
    this.log("debug", message, fields);
  }
  info(message: string, fields?: LogFields): void {
    this.log("info", message, fields);
  }
  warn(message: string, fields?: LogFields): void {
    this.log("warn", message, fields);
  }
  error(message: string, fields?: LogFields): void {
    this.log("error", message, fields);
  }

  /** Append raw, unstructured engine output to a per-engine log file. */
  appendRaw(engine: string, text: string): void {
    const file = path.join(this.dir, `${this.runId}.${engine}.log`);
    fs.appendFileSync(file, text);
    // Mirror into the main run log too so a single file has the full story.
    fs.appendFileSync(this.mainLogFile, text);
  }

  rawLogFileFor(engine: string): string {
    return path.join(this.dir, `${this.runId}.${engine}.log`);
  }
}
