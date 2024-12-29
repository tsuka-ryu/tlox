import { Lox } from "../main.ts";
import { Literal, Token } from "./Token.ts";
import { TokenType, TokenTypeObject } from "./TokenType.ts";

const keywords = new Map([
  ["and", TokenTypeObject.AND],
  ["class", TokenTypeObject.CLASS],
  ["else", TokenTypeObject.ELSE],
  ["false", TokenTypeObject.FALSE],
  ["for", TokenTypeObject.FOR],
  ["fun", TokenTypeObject.FUN],
  ["if", TokenTypeObject.IF],
  ["if", TokenTypeObject.IF],
  ["nil", TokenTypeObject.NIL],
  ["or", TokenTypeObject.OR],
  ["print", TokenTypeObject.PRINT],
  ["return", TokenTypeObject.RETURN],
  ["super", TokenTypeObject.SUPER],
  ["this", TokenTypeObject.THIS],
  ["true", TokenTypeObject.TRUE],
  ["var", TokenTypeObject.VAR],
  ["while", TokenTypeObject.WHILE],
]);

export class Scanner {
  source: string;
  tokens: Token[];
  start: number;
  current: number;
  line: number;

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      // 次の字句の先頭から始める
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token("EOF", "", null, this.line));
    return this.tokens;
  }

  scanToken() {
    const c = this.advance();

    switch (c) {
      case "(":
        this.addToken({ type: TokenTypeObject.LEFT_PAREN });
        break;
      case ")":
        this.addToken({ type: TokenTypeObject.RIGHT_PAREN });
        break;
      case "{":
        this.addToken({ type: TokenTypeObject.LEFT_BRACE });
        break;
      case "}":
        this.addToken({ type: TokenTypeObject.RIGHT_BRACE });
        break;
      case ",":
        this.addToken({ type: TokenTypeObject.COMMA });
        break;
      case ".":
        this.addToken({ type: TokenTypeObject.DOT });
        break;
      case "-":
        this.addToken({ type: TokenTypeObject.MINUS });
        break;
      case "+":
        this.addToken({ type: TokenTypeObject.PLUS });
        break;
      case ";":
        this.addToken({ type: TokenTypeObject.SEMICOLON });
        break;
      case "*":
        this.addToken({ type: TokenTypeObject.STAR });
        break;
      case "!":
        this.addToken(
          this.match("=")
            ? { type: TokenTypeObject.BANG_EQUAL }
            : { type: TokenTypeObject.BANG }
        );
        break;
      case "=":
        this.addToken(
          this.match("=")
            ? { type: TokenTypeObject.EQUAL_EQUAL }
            : { type: TokenTypeObject.EQUAL }
        );
        break;
      case "<":
        this.addToken(
          this.match("=")
            ? { type: TokenTypeObject.LESS_EQUAL }
            : { type: TokenTypeObject.LESS }
        );
        break;
      case ">":
        this.addToken(
          this.match("=")
            ? { type: TokenTypeObject.GREATER_EQUAL }
            : { type: TokenTypeObject.GREATER }
        );
        break;
      case "/":
        if (this.match("/")) {
          // コメントは行末まで続く
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken({ type: TokenTypeObject.SLASH });
        }
        break;

      case " ":
      case "\r":
      case "\t":
        // 空白を無視する
        break;

      case "\n":
        this.line++;
        break;

      case '"':
        // 文字列リテラル
        this.string();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          // TODO: これで動くのかしら
          new Lox().error(this.line, "Unexpected character."); // 想定外の文字
          break;
        }
    }
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    let type: TokenType | undefined = keywords.get(text);

    if (type == null) type = TokenTypeObject.IDENTIFIER;

    this.addToken({ type });
  }

  number() {
    while (this.isDigit(this.peek())) this.advance();

    // 小数部を探して
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // 小数点を消費
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken({
      type: TokenTypeObject.NUMBER,
      literal: Number(this.source.substring(this.start, this.current)),
    });
  }

  string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      new Lox().error(this.line, "Unterminated string"); // 文字列が終結していない
      return;
    }

    this.advance(); // 右側の引用符を消費

    // 左右の引用符を切り捨てる
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken({ type: TokenTypeObject.STRING, literal: value });
  }

  // advance()とpeek()を組み合わせた動作
  match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  // 文字を消費しない先読み
  peek() {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  // 2文字目の先読み
  peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";
  }

  isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  // 文字を消費してからその文字を返す
  advance() {
    return this.source.charAt(this.current++);
  }

  addToken(input: { type: TokenType } | { type: TokenType; literal: Literal }) {
    if ("literal" in input) {
      const text = this.source.substring(this.start, this.current);
      this.tokens.push(new Token(input.type, text, input.literal, this.line));
      return;
    }

    this.addToken({ type: input.type, literal: null });
  }
}
