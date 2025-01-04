import { Expr } from "./Expr.ts";
export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}
export interface Visitor<R> {
  visitExpressionStmt(expr: Expression): R;
  visitPrintStmt(expr: Print): R;
}
export class Expression extends Stmt {
  expression: Expr;
  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}
export class Print extends Stmt {
  expression: Expr;
  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}
