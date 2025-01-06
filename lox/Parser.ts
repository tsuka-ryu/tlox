import { Lox } from "../main.ts";
import { Assign, Call, Logical, Variable } from "./Expr.ts";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.ts";
import { Block, Expression, If, Stmt, Var, While } from "./Stmt.ts";
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
      statements.push(this.declaration());
    }

    return statements;
  }

  expression() {
    return this.assignment();
  }

  assignment(): Expr {
    const expr = this.or();

    if (this.match([TokenTypeObject.EQUAL])) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  or() {
    let expr = this.and();

    while (this.match([TokenTypeObject.OR])) {
      const operator = this.previous();
      const right = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  and() {
    let expr = this.equality();

    while (this.match([TokenTypeObject.AND])) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  declaration() {
    try {
      if (this.match([TokenTypeObject.VAR])) return this.varDeclaration();
      return this.statement();
    } catch (error: unknown) {
      if (error instanceof ParseError) {
        this.synchronize();
        return null;
      }

      throw Error("unknown ParseError");
    }
  }

  statement() {
    if (this.match([TokenTypeObject.FOR])) return this.forStatement();
    if (this.match([TokenTypeObject.IF])) return this.ifStatement();
    if (this.match([TokenTypeObject.PRINT])) return this.printStatement();
    if (this.match([TokenTypeObject.WHILE])) return this.whileStatement();
    if (this.match([TokenTypeObject.LEFT_BRACE]))
      return new Block(this.block());

    return this.expressionStatement();
  }

  forStatement(): Stmt {
    this.consume(TokenTypeObject.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer;
    if (this.match([TokenTypeObject.SEMICOLON])) {
      initializer = null;
    } else if (this.match([TokenTypeObject.VAR])) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenTypeObject.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenTypeObject.SEMICOLON, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenTypeObject.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenTypeObject.RIGHT_PAREN, "Expect ')' after for clauses.");
    let body = this.statement();

    // forループのセマンティックスをbodyに対して合成して作る
    // bodyの後にincrementを実行する
    if (increment != null) {
      body = new Block([body, new Expression(increment)]);
    }

    // 原始的なwhileループを実行
    if (condition == null) condition = new Literal(true);
    body = new While(condition, body);

    // 初期化子があれば、ループ全体の前に実行する
    if (initializer != null) {
      body = new Block([initializer, body]);
    }

    return body;
  }

  ifStatement(): If {
    this.consume(TokenTypeObject.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenTypeObject.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match([TokenTypeObject.ELSE])) {
      elseBranch = this.statement();
    }
    return new If(condition, thenBranch, elseBranch);
  }

  printStatement() {
    const value = this.expression();
    this.consume(TokenTypeObject.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  varDeclaration() {
    const name = this.consume(
      TokenTypeObject.IDENTIFIER,
      "Expect variable name."
    );

    let initializer = null;
    if (this.match([TokenTypeObject.EQUAL])) {
      initializer = this.expression();
    }

    this.consume(
      TokenTypeObject.SEMICOLON,
      "Expect ';' after variable declaration."
    );
    return new Var(name, initializer);
  }

  whileStatement(): While {
    this.consume(TokenTypeObject.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenTypeObject.RIGHT_PAREN, "Expect ')' after condition.");

    const body = this.statement();

    return new While(condition, body);
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenTypeObject.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  block() {
    const statements: Stmt[] = [];

    while (!this.check(TokenTypeObject.RIGHT_BRACE) && !this.isAtEnd()) {
      const _declaration = this.declaration();
      if (_declaration !== null) {
        statements.push(_declaration);
      }
    }

    this.consume(TokenTypeObject.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
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
  unary(): Unary | Literal | Grouping | Variable | Call {
    if (this.match([TokenTypeObject.BANG, TokenTypeObject.MINUS])) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.call();
  }

  finishCall(callee: Expr) {
    const args = [];
    if (!this.check(TokenTypeObject.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match([TokenTypeObject.COMMA]));
    }

    const paren = this.consume(
      TokenTypeObject.RIGHT_PAREN,
      "Expect ')' after arguments."
    );

    return new Call(callee, paren, args);
  }

  call() {
    let expr: Variable | Call | Grouping | Literal | Unary = this.primary();

    while (true) {
      if (this.match([TokenTypeObject.LEFT_PAREN])) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  primary() {
    if (this.match([TokenTypeObject.FALSE])) return new Literal(false);
    if (this.match([TokenTypeObject.TRUE])) return new Literal(true);
    if (this.match([TokenTypeObject.NIL])) return new Literal(null);

    if (this.match([TokenTypeObject.NUMBER, TokenTypeObject.STRING])) {
      return new Literal(this.previous().literal);
    }

    if (this.match([TokenTypeObject.IDENTIFIER])) {
      return new Variable(this.previous());
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
