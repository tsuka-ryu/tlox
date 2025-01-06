import { Interpreter, Object } from "./Interpreter.ts";

export abstract class LoxCallable {
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: Object[]): Object;
}
