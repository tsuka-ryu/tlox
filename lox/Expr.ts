import { Token } from "./Token.ts";
type Expr = string;
export class Binary {
  left: Expr;
  operator: Token;
  right: Expr;
  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}
export class Grouping {
  expression: Expr;
  constructor(expression: Expr) {
    this.expression = expression;
  }
}
export class Literal {
  value: object;
  constructor(value: object) {
    this.value = value;
  }
}
export class Unary {
  operator: Token;
  right: Expr;
  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }
}
