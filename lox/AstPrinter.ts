import { Expr, Visitor, Binary, Grouping, Literal, Unary } from "./Expr.ts";
import { Token } from "./Token.ts";
import { TokenTypeObject } from "./TokenType.ts";

export class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Binary): string {
    return `(${expr.operator.lexeme} ${this.print(expr.left)} ${this.print(
      expr.right
    )})`;
  }

  visitGroupingExpr(expr: Grouping): string {
    return `(group ${this.print(expr.expression)})`;
  }

  visitLiteralExpr(expr: Literal): string {
    return expr.value === null ? "null" : expr.value.toString();
  }

  visitUnaryExpr(expr: Unary): string {
    return `(${expr.operator.lexeme} ${this.print(expr.right)})`;
  }

  parenthesize(name: string, exprs: Expr[]) {
    const builder = [];
    builder.push("(");
    builder.push(name);

    for (const expr of exprs) {
      builder.push(" ");
      builder.push(expr.accept(this));
    }
    builder.push(")");

    return builder.join();
  }

  main() {
    const expression = new Binary(
      new Unary(
        new Token(TokenTypeObject.MINUS, "-", null, 1),
        new Literal(123)
      ),
      new Token(TokenTypeObject.STAR, "*", null, 1),
      new Grouping(new Literal(45.67))
    );

    console.log(new AstPrinter().print(expression));
  }
}

const printer = new AstPrinter();
printer.main();
