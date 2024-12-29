export const TokenTypeObject = {
  // 記号1個のトークン
  LEFT_PAREN: "LEFT_PAREN",
  RIGHT_PAREN: "RIGHT_PAREN",
  LEFT_BRACE: "LEFT_BRACE",
  RIGHT_BRACE: "RIGHT_BRACE",
  COMMA: "COMMA",
  DOT: "DOT",
  MINUS: "MINUS",
  PLUS: "PLUS",
  SEMICOLON: "SEMICOLON",
  SLASH: "SLASH",
  STAR: "STAR",

  // 記号1個または2個によるトークン
  BANG: "BANG",
  BANG_EQUAL: "BANG_EQUAL",
  EQUAL: "EQUAL",
  EQUAL_EQUAL: "EQUAL_EQUAL",
  GREATER: "GREATER",
  GREATER_EQUAL: "GREATER_EQUAL",
  LESS: "LESS",
  LESS_EQUAL: "LESS_EQUAL",

  // リテラル
  IDENTIFIER: "IDENTIFIER",
  STRING: "STRING",
  NUMBER: "NUMBER",

  // キーワード
  AND: "AND",
  CLASS: "CLASS",
  ELSE: "ELSE",
  FALSE: "FALSE",
  FUN: "FUN",
  FOR: "FOR",
  IF: "IF",
  NIL: "NIL",
  OR: "OR",
  PRINT: "PRINT",
  RETURN: "RETURN",
  SUPER: "SUPER",
  THIS: "THIS",
  TRUE: "TRUE",
  VAR: "VAR",
  WHILE: "WHILE",

  // 終端記号
  EOF: "EOF",
} as const;

export type TokenType = keyof typeof TokenTypeObject;
