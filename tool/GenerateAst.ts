const BASE_NAMES = {
  EXPR: "Expr",
  STMT: "Stmt",
};

function main() {
  const outputDir = "./lox";
  defineAst(outputDir, BASE_NAMES.EXPR, [
    // パースできなくなるので、カンマの後には空白を入れない
    "Assign: Token name,Expr value",
    "Binary: Expr left,Token operator,Expr right",
    "Grouping: Expr expression",
    "Literal: LiteralType value", // TODO: あとで正しい型にする
    "Unary: Token operator,Expr right",
    "Variable: Token name",
  ]);

  defineAst(outputDir, BASE_NAMES.STMT, [
    "Expression: Expr expression",
    "Print: Expr expression",
    "Var : Token name,Expr initializer",
  ]);
}

function defineAst(outputDir: string, baseName: string, types: string[]) {
  const path = `${outputDir}/${baseName}.ts`;

  // ファイルを空にする
  Deno.writeTextFileSync(path, "");

  if (baseName === BASE_NAMES.EXPR) {
    // Token型をimport
    const importStmt = `import { Token } from "./Token.ts";`;
    Deno.writeTextFileSync(path, importStmt, { append: true });

    // Literal型を定義
    const literalType = "type LiteralType = number | string | boolean | null;";
    Deno.writeTextFileSync(path, literalType, { append: true });
  } else if (baseName === BASE_NAMES.STMT) {
    // Token型をimport
    const importToken = `import { Token } from "./Token.ts";`;
    Deno.writeTextFileSync(path, importToken, { append: true });

    // Expr型をimport
    const importExpr = ` import { Expr } from "./Expr.ts";`;
    Deno.writeTextFileSync(path, importExpr, { append: true });
  }

  // Exprクラスを定義
  const exprAbstractClass = `export abstract class ${baseName} { abstract accept<R>(visitor: Visitor<R>): R; }`;
  Deno.writeTextFileSync(path, exprAbstractClass, { append: true });

  // Visitorのinterfaceを定義
  const visitorInterfaceStmt = `export interface Visitor<R> {`;
  Deno.writeTextFileSync(path, visitorInterfaceStmt, { append: true });

  for (const type of types) {
    const className = type.split(":")[0].trim();

    Deno.writeTextFileSync(
      path,
      `visit${className}${baseName}(expr: ${className}): R;`,
      {
        append: true,
      }
    );
  }

  Deno.writeTextFileSync(path, "}", { append: true });

  // classの生成
  for (const type of types) {
    const className = type.split(":")[0].trim();
    const fields = type.split(":")[1].trim();

    const classNameStmt = `export class ${className} extends ${baseName}`;
    Deno.writeTextFileSync(path, classNameStmt, { append: true });
    const leftBrace = "{";
    Deno.writeTextFileSync(path, leftBrace, { append: true });

    // fieldを生成
    for (const field of fields.split(",")) {
      const name = field.split(" ")[1];
      const type = field.split(" ")[0];

      const fieldStmt = `${name}:${type};`;

      Deno.writeTextFileSync(path, fieldStmt, { append: true });
    }

    // constructorを生成
    const constructorStmt = `constructor`;
    Deno.writeTextFileSync(path, constructorStmt, { append: true });
    const leftParen = "(";
    Deno.writeTextFileSync(path, leftParen, { append: true });

    // constructorの引数部分
    for (const field of fields.split(",")) {
      const name = field.split(" ")[1];
      const type = field.split(" ")[0];

      const fieldStmt = `${name}:${type},`;

      Deno.writeTextFileSync(path, fieldStmt, { append: true });
    }

    const rightParen = ")";
    Deno.writeTextFileSync(path, rightParen, { append: true });

    // constructor実行部分
    const constructorLeftBrace = "{";
    Deno.writeTextFileSync(path, constructorLeftBrace, { append: true });
    const constructorSuper = "super();";
    Deno.writeTextFileSync(path, constructorSuper, { append: true });

    for (const field of fields.split(",")) {
      const name = field.split(" ")[1];

      const fieldStmt = `this.${name}=${name};`;

      Deno.writeTextFileSync(path, fieldStmt, { append: true });
    }

    // constructorの閉じかっこ
    const constructorRightBrace = "}";
    Deno.writeTextFileSync(path, constructorRightBrace, { append: true });

    // accept関数
    const acceptStmt = `accept<R>(visitor: Visitor<R>): R {`;
    Deno.writeTextFileSync(path, acceptStmt, { append: true });
    const acceptVisitor = `return visitor.visit${className}${baseName}(this);`;
    Deno.writeTextFileSync(path, acceptVisitor, { append: true });
    const acceptRightBrace = "}";
    Deno.writeTextFileSync(path, acceptRightBrace, { append: true });

    // classの閉じかっこ
    const rightBrace = "}";
    Deno.writeTextFileSync(path, rightBrace, { append: true });
  }

  const command = new Deno.Command("deno", {
    args: ["fmt", `./lox/${baseName}.ts`],
  });
  command.outputSync();
}

main();
