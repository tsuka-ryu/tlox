import { Object } from "./Interpreter.ts";

export class Return extends Error {
  value: Object;

  constructor(value: Object) {
    super();
    this.name = "Return";
    this.value = value;
  }
}
