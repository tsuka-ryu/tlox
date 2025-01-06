import { Object } from "./Interpreter.ts";
import RuntimeError from "./RuntimeError.ts";
import { Token } from "./Token.ts";

export class Environment {
  enclosing: Environment | null;
  values: Map<string, Object>;

  constructor(enclosing?: Environment) {
    this.values = new Map();
    this.enclosing = enclosing ?? null;
  }

  get(name: Token): Object {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme) ?? null;
    }

    if (this.enclosing != null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }

  assign(name: Token, value: Object) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  define(name: string, value: Object) {
    this.values.set(name, value);
  }

  getAt(distance: number, name: string) {
    return this.ancestor(distance)?.values.get(name);
  }

  assignAt(distance: number, name: Token, value: Object) {
    this.ancestor(distance)?.values.set(name.lexeme, value);
  }

  ancestor(distance: number) {
    // deno-lint-ignore no-this-alias
    let environment: Environment | null = this;
    for (let i = 0; i < distance; i++) {
      environment = environment?.enclosing ?? null;
    }

    return environment;
  }
}
