; Keywords
[
  "fn"
  "let"
  "mut"
  "const"
  "if"
  "else"
  "while"
  "for"
  "in"
  "return"
  "match"
  "struct"
  "type"
  "impl"
  "trait"
  "pub"
  "import"
  "from"
  "async"
  "await"
  "spawn"
  "defer"
  "new"
  "free"
] @keyword

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  "!"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "->"
  "=>"
  "|>"
  ".."
  "?."
  "??"
] @operator

; Punctuation
["(" ")" "{" "}" "[" "]"] @punctuation.bracket
["," ":" ";"] @punctuation.delimiter
"." @punctuation.delimiter
"@" @punctuation.special

; Types
(primitive_type) @type.builtin
(type_identifier) @type
(optional_type "?" @type)
(result_type "!" @type)

; Functions
(function_definition name: (identifier) @function)
(call_expression function: (identifier) @function.call)
(trait_method name: (identifier) @function)

; Parameters
(parameter name: (identifier) @variable.parameter)

; Variables
(let_declaration name: (identifier) @variable)
(const_declaration name: (identifier) @constant)
(assignment_statement left: (identifier) @variable)

; Struct fields
(struct_field name: (identifier) @property)

; Literals
(integer) @number
(float) @number.float
(string) @string
(string_content) @string
(escape_sequence) @string.escape
(string_interpolation) @string.special
(boolean) @constant.builtin
(none_literal) @constant.builtin

; Comments
(line_comment) @comment
(block_comment) @comment

; Attribute
(attribute) @attribute

; Visibility
(visibility_modifier) @keyword

; Match
(wildcard_pattern) @variable.builtin
(match_arm "=>" @operator)

; Type definitions
(struct_definition name: (type_identifier) @type.definition)
(type_definition name: (type_identifier) @type.definition)
(trait_definition name: (type_identifier) @type.definition)
(type_variant name: (type_identifier) @constructor)
(constructor_pattern name: (type_identifier) @constructor)

; Member access
(member_expression property: (identifier) @property)
