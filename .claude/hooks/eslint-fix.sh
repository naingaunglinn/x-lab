#!/usr/bin/env bash
# PostToolUse(Write|Edit) hook: auto-fix the file Claude just edited with ESLint.
# Best-effort and non-blocking — only touches *.ts / *.tsx, never fails the tool.
# (Uses node to parse the hook's stdin JSON since jq isn't available in this env.)

f=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const p=(j.tool_input&&j.tool_input.file_path)||(j.tool_response&&j.tool_response.filePath)||"";if(/\.tsx?$/.test(p))process.stdout.write(p)}catch(e){}})')

[ -n "$f" ] && npx --no-install eslint --fix "$f" >/dev/null 2>&1

exit 0
