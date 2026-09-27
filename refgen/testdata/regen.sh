#!/bin/sh
# Rebuilds the fixture CLIs and recaptures help/*.txt, then the golden pages.
# Needs cargo and go; the tests themselves do not.
set -eu
cd "$(dirname "$0")"
t=$(mktemp -d)
trap 'rm -rf "$t"' EXIT
(cd clapdemo && cargo build --release --target-dir "$t/clap")
(cd cobrademo && go build -o "$t/cobrademo" .)
capture() { # <bin> <subcommand path...>
  n=$(basename "$1")
  f=$(printf '%s' "$n $(echo "${*#"$1"}")" | tr -s ' ' '-' | sed 's/-$//')
  COLUMNS=100 NO_COLOR=1 CLICOLOR=0 TERM=dumb "$@" --help </dev/null >"help/$f.txt"
}
rm -f help/*.txt
for c in "" config "config get" "config set" run; do
  # shellcheck disable=SC2086 # word splitting of the subcommand path is intended
  capture "$t/clap/release/clapdemo" $c
  capture "$t/cobrademo" $c
done
node ../help2md.mjs --bin bin/clapdemo --out golden
node ../help2md.mjs --bin bin/cobrademo --out golden
