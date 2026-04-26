import os

files = [
    "src/app/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/tables/page.tsx",
    "src/app/dashboard/lineage/page.tsx",
    "src/app/dashboard/intelligence/page.tsx"
]

target = '<div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black"><Globe className="w-3 h-3" strokeWidth={2.5} /></div>'
replacement = '<Globe className="w-5 h-5 text-white" strokeWidth={2.5} />'

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        content = content.replace(target, replacement)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print("Updated", filepath)
