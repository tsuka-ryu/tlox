import { Environment } from "./Environment.ts";
import { Interpreter, Object } from "./Interpreter.ts";
import { LoxCallable } from "./LoxCallable.ts";
import { Return } from "./Return.ts";
import { Function } from "./Stmt.ts";

export class LoxFunction extends LoxCallable {
  declaration: Function;
  closure: Environment;

  constructor(declaration: Function, closure: Environment) {
    super();
    this.closure = closure;
    this.declaration = declaration;
  }

  override arity(): number {
    return this.declaration.params.length;
  }

  override call(interpreter: Interpreter, args: Object[]): Object {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error: unknown) {
      if (error instanceof Return) {
        const returnValue = error;
        return returnValue.value;
      }
    }
    return null;
  }

  override toString() {
    return `<fn ${this.declaration.name.lexeme} >`;
  }
}
