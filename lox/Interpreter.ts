import { Lox } from "../main.ts";
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  Visitor as ExprVisitor,
} from "./Expr.ts";
import { Expression, Print, Stmt, Visitor as StmtVisitor } from "./Stmt.ts";
import RuntimeError from "./RuntimeError.ts";
import { Token } from "./Token.ts";
import { TokenTypeObject } from "./TokenType.ts";

type Object = number | string | boolean | null;

export class Interpreter implements ExprVisitor<Object>, StmtVisitor<Object> {
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

  visitExpressionStmt(stmt: Expression): Object {
    this.evaluate(stmt.expression);
    return null;
  }

  visitPrintStmt(stmt: Print): Object {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return null;
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

  visitLiteralExpr(expr: Literal) {
    return expr.value;
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
