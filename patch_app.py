import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import { ScrollProgress } from './components/ScrollProgress';\n"
content = content.replace("import { ScrollToTop } from './components/ScrollToTop';", "import { ScrollToTop } from './components/ScrollToTop';\n" + import_stmt)

# Add component
main_return_idx = content.find('<div className="min-h-screen bg-slate-50 dark:bg-[#121212] font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-brand-orange selection:text-white">')
if main_return_idx != -1:
    main_return_replacement = '<div className="min-h-screen bg-slate-50 dark:bg-[#121212] font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-brand-orange selection:text-white">\n      <ScrollProgress />\n'
    content = content.replace('<div className="min-h-screen bg-slate-50 dark:bg-[#121212] font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-brand-orange selection:text-white">', main_return_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
