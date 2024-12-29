// Lox.javaの代わり

import { Scanner } from "./lox/Scanner.ts";

export class Lox {
  hadError: boolean;

  constructor() {
    this.hadError = false;
  }

  main() {
    const args = Deno.args;

    if (args.length > 1) {
      console.log("Usage: tlox [script]");
      Deno.exit(64);
    } else if (args.length === 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  runFile(path: string) {
    const bytes = Deno.readFileSync(path).toString(); // TODO: pathの解決が必要かも
    this.run(bytes); // TODO: 何か変換が必要？

    if (this.hadError) Deno.exit(65);
  }

  runPrompt() {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    while (true) {
      // プロンプトを表示
      Deno.stdout.writeSync(encoder.encode("> "));

      // 標準入力から1行読み取る
      const buf = new Uint8Array(1024);
      const value = Deno.stdin.readSync(buf);

      // EOF
      if (value === null) break;

      const line = decoder.decode(buf.subarray(0, value)).trim();

      this.run(line);
      this.hadError = false;
    }
  }

  run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    // TODO: まずはプリントするだけ
    for (const token of tokens) {
      console.log(token);
    }
  }

  error(line: number, message: string) {
    this.report(line, "", message);
  }

  report(line: number, where: string, message: string) {
    console.error(`[line ${line} ] Error ${where}: message`);
    this.hadError = true;
  }
}

// 実行
const lox = new Lox();
lox.main();
