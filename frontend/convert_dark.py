import re

with open("src/components/intelligence/IntelligencePanels.tsx", "r") as f:
    code = f.read()

# Styles
code = code.replace('"bg-green-100 text-green-700 border-green-200"', '"bg-green-500/10 text-green-400 border-green-500/20"')
code = code.replace('"bg-yellow-100 text-yellow-700 border-yellow-200"', '"bg-yellow-500/10 text-yellow-400 border-yellow-500/20"')
code = code.replace('"bg-red-100 text-red-600 border-red-200"', '"bg-red-500/10 text-red-400 border-red-500/20"')

code = code.replace('"bg-red-100 text-red-600"', '"bg-red-500/10 text-red-400 border border-red-500/20"')
code = code.replace('"bg-yellow-100 text-yellow-700"', '"bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"')
code = code.replace('"bg-green-100 text-green-700"', '"bg-green-500/10 text-green-400 border border-green-500/20"')

code = code.replace('bg-gray-100 text-gray-500 border-gray-200', 'bg-[#222] text-gray-400 border-[#333]')

# Components
code = code.replace('bg-white rounded-2xl p-5 shadow-sm', 'vercel-card p-5')
code = code.replace('text-gray-700', 'text-gray-300')
code = code.replace('bg-gray-50 rounded-xl p-3', 'bg-[#111] border border-[#222] rounded-xl p-3')
code = code.replace('text-gray-900', 'text-white')
code = code.replace('text-gray-400', 'text-gray-500')
code = code.replace('animate-pulse bg-gray-50', 'animate-pulse bg-[#111] border border-[#222]')

# Specific hardcoded ones
code = code.replace('bg-gray-100 rounded-full overflow-hidden', 'bg-[#222] rounded-full overflow-hidden')
code = code.replace('bg-red-400', 'bg-red-500')
code = code.replace('bg-yellow-400', 'bg-yellow-500')
code = code.replace('bg-green-400', 'bg-green-500')
code = code.replace('border-gray-100', 'border-[#333]')
code = code.replace('border-gray-200', 'border-[#333]')
code = code.replace('bg-gray-50', 'bg-[#111]')
code = code.replace('bg-white', 'bg-[#0a0a0a]')
code = code.replace('text-gray-600', 'text-gray-400')
code = code.replace('text-gray-500', 'text-gray-400') # shift slightly lighter

with open("src/components/intelligence/IntelligencePanels.tsx", "w") as f:
    f.write(code)

print("Done converting panels to dark mode.")
