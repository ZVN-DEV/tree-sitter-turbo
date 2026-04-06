/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "turbo",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.expression_statement, $.binary_expression],
  ],

  precedences: ($) => [
    [
      "unary",
      "multiplicative",
      "additive",
      "shift",
      "comparison",
      "equality",
      "bitand",
      "bitxor",
      "bitor",
      "and",
      "or",
      "range",
      "assign",
    ],
  ],

  rules: {
    source_file: ($) => repeat($._item),

    _item: ($) =>
      choice(
        $.function_definition,
        $.struct_definition,
        $.type_definition,
        $.trait_definition,
        $.impl_block,
        $.const_declaration,
        $.import_statement,
        $.extern_block,
      ),

    // --- Extern C FFI block ---
    extern_block: ($) =>
      seq(
        $.attribute, // @unsafe
        "extern",
        $.string,
        "{",
        repeat($.extern_fn_signature),
        "}",
      ),

    extern_fn_signature: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $._type))),
      ),

    // --- Comments ---
    line_comment: ($) => token(seq("//", /.*/)),
    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    // --- Import ---
    import_statement: ($) =>
      seq(
        "import",
        choice(
          seq("{", commaSep1($.identifier), "}"),
          $.identifier,
        ),
        "from",
        $.string,
      ),

    // --- Functions ---
    function_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        optional("async"),
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $._type))),
        field("body", $.block),
      ),

    parameter_list: ($) =>
      seq("(", commaSep($.parameter), ")"),

    parameter: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $._type),
      ),

    // --- Struct ---
    struct_definition: ($) =>
      seq(
        optional($.attribute),
        optional($.visibility_modifier),
        "struct",
        field("name", $.type_identifier),
        "{",
        repeat($.struct_field),
        "}",
      ),

    struct_field: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $._type),
      ),

    // --- Type (algebraic) ---
    type_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "type",
        field("name", $.type_identifier),
        "{",
        repeat($.type_variant),
        "}",
      ),

    type_variant: ($) =>
      seq(
        field("name", $.type_identifier),
        optional(seq("(", commaSep1($.variant_field), ")")),
      ),

    variant_field: ($) =>
      choice(
        seq(field("name", $.identifier), ":", field("type", $._type)),
        field("type", $._type),
      ),

    // --- Trait ---
    trait_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "trait",
        field("name", $.type_identifier),
        "{",
        repeat($.trait_method),
        "}",
      ),

    trait_method: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $._type))),
      ),

    // --- Impl ---
    impl_block: ($) =>
      seq(
        "impl",
        field("type", $.type_identifier),
        "{",
        repeat($.function_definition),
        "}",
      ),

    // --- Statements ---
    _statement: ($) =>
      choice(
        $.let_declaration,
        $.const_declaration,
        $.assignment_statement,
        $.return_statement,
        $.expression_statement,
      ),

    let_declaration: ($) =>
      prec.right(
        seq(
          "let",
          optional("mut"),
          field("name", $.identifier),
          optional(seq(":", field("type", $._type))),
          optional(seq("=", field("value", $._expression))),
        ),
      ),

    const_declaration: ($) =>
      prec.right(
        seq(
          "const",
          field("name", $.identifier),
          ":",
          field("type", $._type),
          "=",
          field("value", $._expression),
        ),
      ),

    assignment_statement: ($) =>
      prec.right(
        "assign",
        seq(
          field("left", $._expression),
          field("operator", choice("=", "+=", "-=", "*=", "/=", "%=")),
          field("right", $._expression),
        ),
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional(field("value", $._expression)))),

    expression_statement: ($) => $._expression,

    // --- Block ---
    block: ($) => seq("{", repeat($._statement), "}"),

    // --- Expressions ---
    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.call_expression,
        $.member_expression,
        $.index_expression,
        $.if_expression,
        $.while_expression,
        $.for_expression,
        $.match_expression,
        $.block,
        $.primary_expression,
      ),

    primary_expression: ($) =>
      choice(
        $.identifier,
        $.type_identifier,
        $.integer,
        $.float,
        $.string,
        $.boolean,
        $.none_literal,
        $.some_expression,
        $.ok_expression,
        $.err_expression,
        $.array_literal,
        $.parenthesized_expression,
        $.spawn_expression,
        $.defer_expression,
        $.await_expression,
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["+", "additive"],
          ["-", "additive"],
          ["*", "multiplicative"],
          ["/", "multiplicative"],
          ["%", "multiplicative"],
          ["==", "equality"],
          ["!=", "equality"],
          ["<", "comparison"],
          ["<=", "comparison"],
          [">", "comparison"],
          [">=", "comparison"],
          ["&&", "and"],
          ["||", "or"],
          ["|>", "or"],
          ["..", "range"],
          ["??", "or"],
        ].map(([op, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $._expression),
              field("operator", op),
              field("right", $._expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec.left(
        "unary",
        seq(
          field("operator", choice("!", "-")),
          field("operand", $._expression),
        ),
      ),

    call_expression: ($) =>
      prec(
        1,
        seq(
          field("function", choice($.identifier, $.member_expression)),
          "(",
          commaSep($._expression),
          ")",
        ),
      ),

    member_expression: ($) =>
      prec.left(
        1,
        seq(
          field("object", $._expression),
          choice(".", "?."),
          field("property", $.identifier),
        ),
      ),

    index_expression: ($) =>
      prec.left(
        1,
        seq(
          field("object", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    if_expression: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        field("consequence", $.block),
        optional(seq("else", field("alternative", choice($.if_expression, $.block)))),
      ),

    while_expression: ($) =>
      seq(
        "while",
        field("condition", $._expression),
        field("body", $.block),
      ),

    for_expression: ($) =>
      seq(
        "for",
        field("variable", $.identifier),
        "in",
        field("iterable", $._expression),
        field("body", $.block),
      ),

    match_expression: ($) =>
      seq(
        "match",
        field("value", $._expression),
        "{",
        repeat($.match_arm),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", $._pattern),
        "=>",
        field("value", $._expression),
      ),

    _pattern: ($) =>
      choice(
        $.identifier,
        $.type_identifier,
        $.integer,
        $.float,
        $.string,
        $.boolean,
        $.none_literal,
        $.wildcard_pattern,
        $.constructor_pattern,
      ),

    wildcard_pattern: ($) => "_",

    constructor_pattern: ($) =>
      seq(
        field("name", $.type_identifier),
        "(",
        commaSep($.identifier),
        ")",
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    array_literal: ($) => seq("[", commaSep($._expression), "]"),

    spawn_expression: ($) => prec.right(seq("spawn", $._expression)),
    defer_expression: ($) => prec.right(seq("defer", $._expression)),
    await_expression: ($) => prec.right(seq("await", $._expression)),
    some_expression: ($) => seq("some", "(", $._expression, ")"),
    ok_expression: ($) => seq("ok", "(", $._expression, ")"),
    err_expression: ($) => seq("err", "(", $._expression, ")"),

    // --- Types ---
    _type: ($) =>
      choice(
        $.primitive_type,
        $.type_identifier,
        $.optional_type,
        $.result_type,
        $.array_type,
        $.map_type,
      ),

    primitive_type: ($) =>
      choice(
        "i8", "i16", "i32", "i64", "i128", "isize",
        "u8", "u16", "u32", "u64", "u128", "usize",
        "f32", "f64",
        "bool", "str", "char",
      ),

    optional_type: ($) => prec.left(1, seq($._type, "?")),
    result_type: ($) => prec.left(1, seq($._type, "!", $._type)),
    array_type: ($) => seq("[", $._type, "]"),
    map_type: ($) => seq("{", $._type, ":", $._type, "}"),

    // --- Attributes ---
    attribute: ($) =>
      seq(
        "@",
        $.identifier,
        optional(seq("(", commaSep1($.identifier), ")")),
      ),

    visibility_modifier: ($) => "pub",

    // --- Literals & identifiers ---
    type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,
    identifier: ($) => /[a-z_][a-zA-Z0-9_]*/,
    integer: ($) => /[0-9][0-9_]*/,
    float: ($) => /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9]+)?/,
    string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            $.string_content,
            $.escape_sequence,
            $.string_interpolation,
          ),
        ),
        '"',
      ),
    string_content: ($) => token.immediate(prec(1, /[^"\\{]+/)),
    escape_sequence: ($) => token.immediate(seq("\\", /[nrt\\"{}]/)),
    string_interpolation: ($) =>
      seq(
        token.immediate("{"),
        $._expression,
        "}",
      ),
    boolean: ($) => choice("true", "false"),
    none_literal: ($) => "none",
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
