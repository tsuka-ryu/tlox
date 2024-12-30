import { Lox } from "../main.ts";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.ts";
import { Token } from "./Token.ts";
import { TokenType, TokenTypeObject } from "./TokenType.ts";

class ParseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ParseError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class Parser {
  tokens: Token[];
  current: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    try {
      return this.expression();
    } catch (e: unknown) {
      console.log("parse error", e);
      return null;
    }
  }

  expression() {
    return this.equality();
  }

  equality() {
    let expr: Expr = this.comparison();

    while (
      this.match([TokenTypeObject.BANG_EQUAL, TokenTypeObject.EQUAL_EQUAL])
    ) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  comparison() {
    let expr: Expr = this.term();

    while (
      this.match([
        TokenTypeObject.GREATER,
        TokenTypeObject.GREATER_EQUAL,
        TokenTypeObject.LESS,
        TokenTypeObject.LESS_EQUAL,
      ])
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  term() {
    let expr: Expr = this.factor();

    while (this.match([TokenTypeObject.MINUS, TokenTypeObject.PLUS])) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  factor() {
    let expr: Expr = this.unary();

    while (this.match([TokenTypeObject.SLASH, TokenTypeObject.STAR])) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  // NOTE: unaryは型を明示しないとanyになってしまう
  unary(): Unary | Literal | Grouping {
    if (this.match([TokenTypeObject.BANG, TokenTypeObject.MINUS])) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.primary();
  }

  primary() {
    if (this.match([TokenTypeObject.FALSE])) return new Literal(false);
    if (this.match([TokenTypeObject.TRUE])) return new Literal(true);
    if (this.match([TokenTypeObject.NIL])) return new Literal(null);

    if (this.match([TokenTypeObject.NUMBER, TokenTypeObject.STRING])) {
      return new Literal(this.previous().literal);
    }

    if (this.match([TokenTypeObject.LEFT_PAREN])) {
      const expr = this.expression();
      this.consume(TokenTypeObject.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  match(types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  check(type: TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenTypeObject.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  error(token: Token, message: string) {
    new Lox().error({ token, message });
    return new ParseError(message);
  }

  synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenTypeObject.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenTypeObject.CLASS:
        case TokenTypeObject.FOR:
        case TokenTypeObject.FUN:
        case TokenTypeObject.IF:
        case TokenTypeObject.PRINT:
        case TokenTypeObject.RETURN:
        case TokenTypeObject.VAR:
        case TokenTypeObject.WHILE:
          return;
      }

      this.advance();
    }
  }
}
