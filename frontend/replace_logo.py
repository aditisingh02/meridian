import re
import os

files = [
    "src/app/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/tables/page.tsx",
    "src/app/dashboard/lineage/page.tsx",
    "src/app/dashboard/intelligence/page.tsx"
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Import Globe if not imported
    if "import { Globe }" not in content and "lucide-react" not in content:
        content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { Globe } from "lucide-react";')
    elif "lucide-react" in content and "Globe" not in content:
        content = re.sub(r'import\s+{(.*?)}\s+from\s+"lucide-react";', r'import {\1, Globe } from "lucide-react";', content)

    # Replace the M logo
    content = content.replace(
        '<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-[9px] font-bold">M</span>',
        '<div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black"><Globe className="w-3 h-3" strokeWidth={2.5} /></div>'
    )
    
    content = content.replace(
        '<span className="text-black text-[9px] font-bold">M</span>',
        '<Globe className="w-3 h-3 text-black" strokeWidth={2.5} />'
    )

    with open(filepath, 'w') as f:
        f.write(content)
    print("Updated", filepath)

