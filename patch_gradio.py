import os

path = r"C:\Users\ibrah\Projects\idm-vton-venv\Lib\site-packages\gradio_client\utils.py"
if not os.path.exists(path):
    print(f"Error: path not found: {path}")
    exit(1)

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

target = 'if "const" in schema:'
replacement = 'if isinstance(schema, dict) and "const" in schema:'

if target in content:
    new_content = content.replace(target, replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched gradio_client/utils.py!")
else:
    print("Target string not found in file. Already patched or different version.")
