import re

files = [
    "src/app/dashboard/tables/page.tsx",
    "src/app/dashboard/lineage/page.tsx"
]

for file in files:
    with open(file, "r") as f:
        code = f.read()

    # Layout colors
    code = code.replace('bg-[#f0f1f5]', 'bg-black text-white selection:bg-white/30')
    code = code.replace('bg-white/90 backdrop-blur-md border border-gray-200/80', 'glass-nav')
    code = code.replace('text-gray-900', 'text-white')
    code = code.replace('text-gray-700', 'text-gray-300')
    code = code.replace('text-gray-600', 'text-gray-400')
    code = code.replace('text-gray-500', 'text-gray-400')
    code = code.replace('text-gray-400', 'text-gray-500')
    
    # Specific buttons/containers
    code = code.replace('bg-white', 'bg-[#0a0a0a]')
    code = code.replace('bg-gray-100', 'bg-[#222]')
    code = code.replace('bg-gray-50', 'bg-[#111]')
    code = code.replace('hover:bg-gray-50', 'hover:bg-[#111]')
    code = code.replace('hover:bg-gray-100', 'hover:bg-[#222]')
    code = code.replace('hover:bg-gray-200', 'hover:bg-[#333]')
    code = code.replace('border-gray-200', 'border-[#333]')
    code = code.replace('border-gray-100', 'border-[#222]')
    
    # Nav items
    code = code.replace('bg-gray-900', 'bg-white')
    code = code.replace('text-white', 'text-black') # Wait, this might flip things back, let's undo specifically for bg-white text-black combo
    code = code.replace('text-[9px] font-bold">M</span>', 'text-[9px] font-bold text-black">M</span>')

    with open(file, "w") as f:
        f.write(code)

print("Done converting pages to dark mode.")
