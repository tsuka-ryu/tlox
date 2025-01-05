import { Token } from "./Token.ts";
import { Expr } from "./Expr.ts";
export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}
export interface Visitor<R> {
  visitBlockStmt(expr: Block): R;
  visitExpressionStmt(expr: Expression): R;
  visitIfStmt(expr: If): R;
  visitPrintStmt(expr: Print): R;
  visitWhileStmt(expr: While): R;
  visitVarStmt(expr: Var): R;
}
export class Block extends Stmt {
  statements: Stmt[];
  constructor(statements: Stmt[]) {
    super();
    this.statements = statements;
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
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
export class If extends Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIfStmt(this);
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
export class While extends Stmt {
  condition: Expr;
  body: Stmt;
  constructor(condition: Expr, body: Stmt) {
    super();
    this.condition = condition;
    this.body = body;
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}
export class Var extends Stmt {
  name: Token;
  initializer: Expr | null;
  constructor(name: Token, initializer: Expr | null) {
    super();
    this.name = name;
    this.initializer = initializer;
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
