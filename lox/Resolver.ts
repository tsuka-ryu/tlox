import { Lox } from "../main.ts";
import {
  Assign,
  Binary,
  Call,
  Expr,
  Visitor as ExprVisitor,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from "./Expr.ts";
import { Interpreter } from "./Interpreter.ts";
import {
  Block,
  Expression,
  Function,
  If,
  Print,
  Return,
  Stmt,
  Visitor as StmtVisitor,
  Var,
  While,
} from "./Stmt.ts";
import { Token } from "./Token.ts";

type ResolveType =
  | {
      statements: Stmt[];
    }
  | { statement: Stmt }
  | { expr: Expr };

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  interpreter: Interpreter;
  scopes: Array<Map<string, boolean>>;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.scopes = [];
  }

  resolve(input: ResolveType) {
    if ("statements" in input) {
      for (const statement of input.statements) {
        this.resolve({ statement });
      }
    } else if ("statement" in input) {
      input.statement.accept(this);
    } else {
      input.expr.accept(this);
    }
  }

  resolveFunction(fun: Function) {
    this.beginScope();
    for (const param of fun.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve({ statements: fun.body });
    this.endScope();
  }

  beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }

  endScope() {
    this.scopes.pop();
  }

  declare(name: Token) {
    if (this.scopes.length == 0) return;

    const scope = this.scopes[this.scopes.length - 1];
    scope.set(name.lexeme, false);
  }

  define(name: Token) {
    if (this.scopes.length == 0) return;
    this.scopes[this.scopes.length - 1].set(name.lexeme, true);
  }

  resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  visitBlockStmt(stmt: Block): void {
    this.beginScope();
    this.resolve({ statements: stmt.statements });
    this.endScope();
  }

  visitIfStmt(stmt: If): void {
    this.resolve({ expr: stmt.condition });
    this.resolve({ statement: stmt.thenBranch });
    if (stmt.elseBranch != null) this.resolve({ statement: stmt.elseBranch });
  }

  visitPrintStmt(stmt: Print): void {
    this.resolve({ expr: stmt.expression });
  }

  visitReturnStmt(stmt: Return): void {
    if (stmt.value != null) {
      this.resolve({ expr: stmt.value });
    }
  }

  visitExpressionStmt(stmt: Expression): void {
    this.resolve({ expr: stmt.expression });
  }

  visitFunctionStmt(stmt: Function): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt);
  }

  visitVarStmt(stmt: Var): void {
    this.declare(stmt.name);
    if (stmt.initializer != null) {
      this.resolve({ expr: stmt.initializer });
    }
    this.define(stmt.name);
  }

  visitWhileStmt(stmt: While): void {
    this.resolve({ expr: stmt.condition });
    this.resolve({ statement: stmt.body });
  }

  visitAssignExpr(expr: Assign): void {
    this.resolve({ expr: expr.value });
    this.resolveLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: Binary): void {
    this.resolve({ expr: expr.left });
    this.resolve({ expr: expr.right });
  }

  visitCallExpr(expr: Call): void {
    this.resolve({ expr: expr.callee });

    for (const arg of expr.args) {
      this.resolve({ expr: arg });
    }
  }

  visitGroupingExpr(expr: Grouping): void {
    this.resolve({ expr: expr.expression });
  }

  visitLiteralExpr(_expr: Literal): void {}

  visitLogicalExpr(expr: Logical): void {
    this.resolve({ expr: expr.left });
    this.resolve({ expr: expr.right });
  }

  visitUnaryExpr(expr: Unary): void {
    this.resolve({ expr: expr.right });
  }

  visitVariableExpr(expr: Variable): void {
    if (
      !(
        this.scopes.length == 0 &&
        this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false
      )
    ) {
      new Lox().error({
        token: expr.name,
        message: "Can't read local variable in its own initializer.",
      });
    }

    this.resolveLocal(expr, expr.name);
  }
}
