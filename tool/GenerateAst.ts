function main() {
  const outputDir = "./lox";
  defineAst(outputDir, "Expr", [
    // パースできなくなるので、カンマの後には空白を入れない
    "Binary: Expr left,Token operator,Expr right",
    "Grouping: Expr expression",
    "Literal: object value", // TODO: あとで正しい型にする
    "Unary: Token operator,Expr right",
  ]);
}

function defineAst(outputDir: string, baseName: string, types: string[]) {
  const path = `${outputDir}/${baseName}.ts`;
  const importStmt = `import { Token } from "./Token.ts";`;
  const typeStmt = `type Expr = string;`;

  // ファイルを空にする
  Deno.writeTextFileSync(path, "");

  Deno.writeTextFileSync(path, importStmt, { append: true });
  Deno.writeTextFileSync(path, typeStmt, { append: true });

  for (const type of types) {
    const className = type.split(":")[0].trim();
    const fields = type.split(":")[1].trim();

    const classNameStmt = `export class ${className}`;
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

    for (const field of fields.split(",")) {
      const name = field.split(" ")[1];
      const type = field.split(" ")[0];

      const fieldStmt = `${name}:${type},`;

      Deno.writeTextFileSync(path, fieldStmt, { append: true });
    }

    const rightParen = ")";
    Deno.writeTextFileSync(path, rightParen, { append: true });

    const constructorLeftBrace = "{";
    Deno.writeTextFileSync(path, constructorLeftBrace, { append: true });

    for (const field of fields.split(",")) {
      const name = field.split(" ")[1];

      const fieldStmt = `this.${name}=${name};`;

      Deno.writeTextFileSync(path, fieldStmt, { append: true });
    }

    const constructorRightBrace = "}";
    Deno.writeTextFileSync(path, constructorRightBrace, { append: true });

    const rightBrace = "}";
    Deno.writeTextFileSync(path, rightBrace, { append: true });
  }

  const command = new Deno.Command("deno", { args: ["fmt", "./lox/Expr.ts"] });
  command.outputSync();
}

main();
