import { Object } from "./Interpreter.ts";
import RuntimeError from "./RuntimeError.ts";
import { Token } from "./Token.ts";

export class Environment {
  values: Map<string, Object>;

  constructor() {
    this.values = new Map();
  }

  get(name: Token) {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }

  assign(name: Token, value: Object) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: Object) {
    this.values.set(name, value);
  }
}
