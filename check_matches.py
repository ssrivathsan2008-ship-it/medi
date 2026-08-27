import os
import re

js_path = r"C:\Users\srivathsan s\.gemini\antigravity-ide\scratch\medikiosk\public\assets\index-Dn-klrAn.js"

with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find occurrences of prescriptions
print("Occurrences of prescriptions:")
for match in re.finditer(r"[a-zA-Z_0-9]+(?:\.prescriptions)\b", content):
    start = max(0, match.start() - 50)
    end = min(len(content), match.end() + 100)
    print(f"Index {match.start()}: {content[start:end]}\n")
