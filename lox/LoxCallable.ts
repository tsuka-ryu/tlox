import { Interpreter, Object } from "./Interpreter.ts";

export abstract class LoxCallable {
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: Object[]): Object;
}

export class Clock extends LoxCallable {
  arity(): number {
    return 0;
  }

  call(_interpreter: Interpreter, _args: Object[]): Object {
    return Date.now() / 100.0;
  }

  override toString(): string {
    return "<native fn>";
  }
}
