const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state for isServicesLoading
if (!code.includes('isServicesLoading')) {
  code = code.replace(
    /const \[loadingReviews, setLoadingReviews\] = useState\(true\);/,
    'const [loadingReviews, setLoadingReviews] = useState(true);\n  const [isServicesLoading, setIsServicesLoading] = useState(true);'
  );
}

// 2. Add useEffect to simulate loading
if (!code.includes('setIsServicesLoading(false)')) {
  code = code.replace(
    /useEffect\(\(\) => \{\n\s*localStorage\.setItem\('the_shine_lang', lang\);\n\s*\}, \[lang\]\);/,
    'useEffect(() => {\n    localStorage.setItem(\'the_shine_lang\', lang);\n  }, [lang]);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setIsServicesLoading(false), 1500);\n    return () => clearTimeout(timer);\n  }, []);'
  );
}

// 3. Update the Services grid to render skeleton when loading
const servicesGridReplacement = `{isServicesLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between animate-pulse h-full">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700/50 mb-6" />
                    <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-4" />
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-2" />
                    <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-6" />
                  </div>
                  <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md" />
                </div>
              ))
            ) : (
              t.services.items.map((item, index) => {`;

code = code.replace(
  /\{t\.services\.items\.map\(\(item, index\) => \{/,
  servicesGridReplacement
);

// close the parenthesis for the conditional rendering if needed
// Actually, `t.services.items.map` is currently: 
// {t.services.items.map((item, index) => { ... return (...); })}
// So we need to close the `)` of the ternary block `isServicesLoading ? (...) : (...)`
code = code.replace(
  /<\/div>\n\s*\}\)\}\n\s*<\/div>/,
  '</div>\n              );\n            })}\n          </div>'
);

// Let's be careful with the end of the map
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for services skeleton');
