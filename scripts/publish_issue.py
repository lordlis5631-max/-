#!/usr/bin/env python3
"""Publish reviewed regional data from a GitHub issue."""
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
issue = event.get("issue", {})
assert event.get("action") == "labeled", "Expected labeled event"
assert event.get("label", {}).get("name") == "publish-approved", "Approval label required"
assert issue.get("state") == "open", "Issue must be open"
assert any(x.get("name") == "publish-approved" for x in issue.get("labels", []))

body = issue.get("body") or ""
fence = chr(96) * 3
pattern = r"###\s*REGION_DATA_JSON\s*\n+\s*" + re.escape(fence) + r"json\s*\n(.*?)\n" + re.escape(fence)
match = re.search(pattern, body, re.S | re.I)
if not match:
    raise ValueError("Cannot find REGION_DATA_JSON block in approved issue")

proposal = json.loads(match.group(1))
region = proposal.get("region")
allowed_regions = {
    "bashkortostan", "mari-el", "mordovia", "tatarstan", "udmurtia",
    "chuvashia", "perm", "kirov", "nizhny", "orenburg", "penza",
    "samara", "saratov", "ulyanovsk"
}
if region not in allowed_regions:
    raise ValueError("Unknown region identifier")

allowed_keys = {
    "trend", "support", "where", "missing", "risks", "resources",
    "practiceDescription", "presentationUrl", "contactName",
    "socialUrl", "phone"
}
data = proposal.get("data")
if not isinstance(data, dict) or set(data) != allowed_keys:
    raise ValueError("Data must include exactly the 11 expected form fields")
for key, value in data.items():
    if not isinstance(value, str):
        raise ValueError(f"{key}: value must be a string")
    if len(value) > (500 if key in ("presentationUrl", "socialUrl") else 1000):
        raise ValueError(f"{key}: field exceeds limit")
    if key in ("presentationUrl", "socialUrl") and value:
        parsed = urlparse(value)
        if parsed.scheme not in ("https", "http") or not parsed.hostname:
            raise ValueError(f"{key}: URL must use http(s)")

file = Path("content-data.js")
prefix = "window.PFO_CONTENT = "
content = file.read_text(encoding="utf-8")
index = content.find(prefix)
if index == -1:
    raise ValueError("Unexpected content-data.js format")
published = json.loads(content[index + len(prefix):].strip().removesuffix(";"))
if not isinstance(published, dict):
    raise ValueError("Published data must be an object")
published[region] = data
file.write_text(
    "// Опубликованные данные: изменения после проверки владельцем GitHub.\n"
    + prefix + json.dumps(published, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8"
)
print(f"Approved region {region} from issue #{issue.get('number')}")
