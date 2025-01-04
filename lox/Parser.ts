import { Lox } from "../main.ts";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.ts";
import { Expression } from "./Stmt.ts";
import { Print } from "./Stmt.ts";
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
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }

    return statements;
  }

  expression() {
    return this.equality();
  }

  statement() {
    if (this.match([TokenTypeObject.PRINT])) return this.printStatement();

    return this.expressionStatement();
  }

  printStatement() {
    const value = this.expression();
    this.consume(TokenTypeObject.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenTypeObject.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
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

  // 規則と一致するか
  match(types: TokenType[]) {
    for (const type of types) {
      // 現在のトークンが与えらた規則＝型と一致するかチェック
      if (this.check(type)) {
        // 一致したら消費する
        this.advance();
        return true;
      }
    }
    return false;
  }

  // 型と一致するかを確認する
  // 閉じかっこを探す場合などに使う
  consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  // トークンは消費せず、型が同じかチェック
  check(type: TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  // トークンを消費して、トークンを返す
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenTypeObject.EOF;
  }

  // まだ消費していない現在のトークンを返す
  peek() {
    return this.tokens[this.current];
  }

  // 最後に消費したトークンを返す
  // いまmatch()したトークンを取得するときに使える
  previous() {
    return this.tokens[this.current - 1];
  }

  error(token: Token, message: string) {
    new Lox().error({ token, message });
    return new ParseError(message);
  }

  // TODO: 「文」が実装されたら使うらしい
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
