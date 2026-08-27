import os
import requests
import re

PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "public"))
ASSETS_DIR = os.path.join(PUBLIC_DIR, "assets")

os.makedirs(ASSETS_DIR, exist_ok=True)

# 1. Download index.html
print("Downloading index.html...")
index_html_url = "https://medikiosk.ai.studio/"
res_html = requests.get(index_html_url)
index_html_content = res_html.content

# Save index.html
with open(os.path.join(PUBLIC_DIR, "index.html"), "wb") as f:
    f.write(index_html_content)
print("Saved index.html")

# 2. Download CSS
print("Downloading CSS...")
css_url = "https://medikiosk.ai.studio/assets/index-Dh-0Hldz.css"
res_css = requests.get(css_url)
with open(os.path.join(ASSETS_DIR, "index-Dh-0Hldz.css"), "wb") as f:
    f.write(res_css.content)
print("Saved CSS")

# 3. Download JS
print("Downloading JS bundle...")
js_url = "https://medikiosk.ai.studio/assets/index-Dn-klrAn.js"
res_js = requests.get(js_url)
js_content = res_js.content

# Save JS bundle
with open(os.path.join(ASSETS_DIR, "index-Dn-klrAn.js"), "wb") as f:
    f.write(js_content)
print("Saved raw JS bundle")
