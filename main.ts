// Lox.javaの代わり

import { AstPrinter } from "./lox/AstPrinter.ts";
import { Parser } from "./lox/Parser.ts";
import { Scanner } from "./lox/Scanner.ts";
import { Token } from "./lox/Token.ts";
import { TokenTypeObject } from "./lox/TokenType.ts";

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
    const bytes = Deno.readFileSync(path);
    const lines = new TextDecoder().decode(bytes);
    this.run(lines);

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
    const parser = new Parser(tokens);
    const expression = parser.parse();

    if (this.hadError) return;
    if (expression == null) return;

    console.log(new AstPrinter().print(expression));
  }

  error(
    input: { line: number; message: string } | { token: Token; message: string }
  ) {
    if ("line" in input) {
      this.report(input.line, "", input.message);
    }

    if ("token" in input) {
      if (input.token.type === TokenTypeObject.EOF) {
        this.report(input.token.line, " at end", input.message);
      } else {
        this.report(
          input.token.line,
          ` at '${input.token.lexeme}'`,
          input.message
        );
      }
    }
  }

  report(line: number, where: string, message: string) {
    console.error(`[line ${line} ] Error ${where}: ${message}`);
    this.hadError = true;
  }
}

// 実行
const lox = new Lox();
lox.main();
