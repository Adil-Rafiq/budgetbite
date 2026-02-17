#!/usr/bin/env bash
# Usage: bash gen_tree.sh [output_file] [max_depth]
# Run from the root of your project.
# Defaults: output = project_structure.md, depth = 4

OUTPUT="${1:-project_structure.md}"
DEPTH="${2:-4}"
ROOT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$ROOT_DIR")"

# Files/dirs to always ignore
EXCLUDES=(
  ".git"
  "node_modules"
  "__pycache__"
  ".venv"
  "venv"
  # ".env"
  "dist"
  "build"
  ".next"
  ".DS_Store"
  "*.pyc"
  "*.pyo"
)

# Build the find -prune pattern from the exclude list
PRUNE_ARGS=()
for excl in "${EXCLUDES[@]}"; do
  PRUNE_ARGS+=(-name "$excl" -o)
done
# Remove trailing -o
unset 'PRUNE_ARGS[${#PRUNE_ARGS[@]}-1]'

# ── helpers ──────────────────────────────────────────────────────────────────

generate_tree() {
  # Use `tree` if available, otherwise fall back to find
  if command -v tree &>/dev/null; then
    local ignore_pattern
    ignore_pattern=$(IFS='|'; echo "${EXCLUDES[*]}")
    tree -a -L "$DEPTH" --noreport -I "$ignore_pattern" "$ROOT_DIR"
  else
    echo "(tree not installed – using find fallback)"
    find "$ROOT_DIR" \
      \( "${PRUNE_ARGS[@]}" \) -prune \
      -o -maxdepth "$DEPTH" -print \
    | sed "s|$ROOT_DIR||" \
    | sort
  fi
}

# ── main ─────────────────────────────────────────────────────────────────────

cat > "$OUTPUT" <<EOF
# Project Structure: $PROJECT_NAME

> Generated on $(date '+%Y-%m-%d %H:%M:%S')  
> Root: \`$ROOT_DIR\`  
> Max depth: $DEPTH

## Directory Tree

\`\`\`
$(generate_tree)
\`\`\`

## Notes

<!-- Add any context about the project here before pasting to an AI chat -->
EOF

echo "✅  Written to: $OUTPUT"