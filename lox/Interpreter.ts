import { Lox } from "../main.ts";
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  Visitor as ExprVisitor,
  Variable,
  Assign,
  Logical,
  Call,
} from "./Expr.ts";
import {
  Block,
  Expression,
  Function,
  If,
  Print,
  Stmt,
  Visitor as StmtVisitor,
  Var,
  Return,
  While,
} from "./Stmt.ts";
import RuntimeError from "./RuntimeError.ts";
import { Token } from "./Token.ts";
import { TokenTypeObject } from "./TokenType.ts";
import { Environment } from "./Environment.ts";
import { Clock, LoxCallable } from "./LoxCallable.ts";
import { LoxFunction } from "./LoxFunction.ts";
import { Return as ReturnClass } from "./Return.ts";

export type Object =
  | LoxCallable
  | LoxFunction
  | number
  | string
  | boolean
  | null;

export class Interpreter implements ExprVisitor<Object>, StmtVisitor<Object> {
  globals = new Environment();
  environment = this.globals;
  locals = new Map<Expr, number>();

  constructor() {
    this.globals.define("clock", new Clock());
  }

  interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error: unknown) {
      if (error instanceof RuntimeError) {
        return new Lox().runtimeError(error);
      }
      throw Error("Runtime unknown error");
    }
  }

  evaluate(expr: Expr): Object {
    return expr.accept(this);
  }

  execute(stmt: Stmt) {
    stmt.accept(this);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitBlockStmt(stmt: Block): Object {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }

  visitExpressionStmt(stmt: Expression): Object {
    this.evaluate(stmt.expression);
    return null;
  }

  visitFunctionStmt(stmt: Function): Object {
    const fun = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fun);
    return null;
  }

  visitIfStmt(stmt: If): Object {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
    return null;
  }

  visitPrintStmt(stmt: Print): Object {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return null;
  }

  visitReturnStmt(stmt: Return) {
    let value = null;
    if (stmt.value != null) value = this.evaluate(stmt.value);

    throw new ReturnClass(value);

    // unreachable
    return null;
  }

  visitVarStmt(stmt: Var): Object {
    let value = null;

    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
    return null;
  }

  visitWhileStmt(stmt: While): Object {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }

    return null;
  }

  visitAssignExpr(expr: Assign): Object {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance != null) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }
    return value;
  }

  visitBinaryExpr(expr: Binary) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenTypeObject.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenTypeObject.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenTypeObject.GREATER:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return left > right;
        }
        break;
      case TokenTypeObject.GREATER_EQUAL:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return left >= right;
        }
        break;
      case TokenTypeObject.LESS:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return left < right;
        }
        break;
      case TokenTypeObject.LESS_EQUAL:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return left <= right;
        }
        break;
      case TokenTypeObject.MINUS:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return Number(left) - Number(right);
        }
        break;
      case TokenTypeObject.PLUS:
        // 数値型の場合は数値として計算
        if (!isNaN(Number(left)) && !isNaN(Number(right))) {
          return Number(left) + Number(right);
        }

        // 文字列の場合は、文字結合
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }

        // 上記以外はエラー
        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings"
        );
      case TokenTypeObject.SLASH:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return Number(left) / Number(right);
        }
        break;
      case TokenTypeObject.STAR:
        if (
          this.checkNumberOperand(expr.operator, left) &&
          this.checkNumberOperand(expr.operator, right)
        ) {
          return Number(left) * Number(right);
        }
        break;
    }

    // unreachable
    return null;
  }

  visitCallExpr(expr: Call): Object {
    // TODO: 正しく型付けしたい
    const callee = this.evaluate(expr.callee) as unknown as LoxCallable;

    const args = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (callee.call == null) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes."
      );
    }

    const fun = callee;
    if (args.length !== fun.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${fun.arity()} arguments but got ${args.length}.`
      );
    }
    return fun.call(this, args);
  }

  visitLiteralExpr(expr: Literal) {
    // console.log(expr.value);
    return expr.value;
  }

  visitLogicalExpr(expr: Logical): Object {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenTypeObject.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }
    return this.evaluate(expr.right);
  }

  visitGroupingExpr(expr: Grouping) {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: Unary) {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenTypeObject.BANG:
        return !this.isTruthy(right);
      case TokenTypeObject.MINUS:
        if (this.checkNumberOperand(expr.operator, right)) {
          return -right;
        }
    }
    // unreachable
    return null;
  }

  visitVariableExpr(expr: Variable): Object {
    return this.lookUpVariable(expr.name, expr);
  }

  lookUpVariable(name: Token, expr: Expr) {
    const distance = this.locals.get(expr);
    if (distance != null) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }

  checkNumberOperand(operator: Token, operand: unknown): operand is number {
    if (!isNaN(Number(operand))) return true;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  isTruthy(object: Object) {
    if (object == null) return false;
    // NOTE: loxの文法と違うが、jsのfalsyに合わせる
    return !!object;
  }

  isEqual(a: Object, b: Object) {
    if (a == null && b == null) return true;
    if (a == null) return false;

    return a === b;
  }

  stringify(object: Object) {
    if (object == null) return "nil";

    // TODO: 霜二桁を切る処理は省略

    return object.toString();
  }
}
