import { Token } from "./Token.ts";

class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.name = "RuntimeError";
    this.token = token;
  }
}

export default RuntimeError;
