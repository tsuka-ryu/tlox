// Lox.javaの代わり

// import { AstPrinter } from "./lox/AstPrinter.ts";
import { Interpreter } from "./lox/Interpreter.ts";
import { Parser } from "./lox/Parser.ts";
import { Resolver } from "./lox/Resolver.ts";
import RuntimeError from "./lox/RuntimeError.ts";
import { Scanner } from "./lox/Scanner.ts";
import { Token } from "./lox/Token.ts";
import { TokenTypeObject } from "./lox/TokenType.ts";

export class Lox {
  interpreter: Interpreter;
  hadError: boolean;
  hadRuntimeError: boolean;

  constructor() {
    this.interpreter = new Interpreter();
    this.hadError = false;
    this.hadRuntimeError = false;
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
    if (this.hadRuntimeError) Deno.exit(70);
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
    const statements = parser.parse().filter((stmt) => !!stmt);

    if (this.hadError) return;

    const resolver = new Resolver(this.interpreter);
    resolver.resolve({ statements });
    // NOTE: 解決した結果
    // console.log({ locals: this.interpreter.locals });

    if (this.hadError) return;

    this.interpreter.interpret(statements);

    // NOTE: 動作確認用のAstPrinter
    // console.log(new AstPrinter().print(expression));
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

  runtimeError(error: RuntimeError) {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    this.hadRuntimeError = true;
  }

  report(line: number, where: string, message: string) {
    console.error(`[line ${line} ] Error ${where}: ${message}`);
    this.hadError = true;
  }
}

// 実行
const lox = new Lox();
lox.main();
