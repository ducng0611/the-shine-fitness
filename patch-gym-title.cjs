const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

// Di chuyển title ngang hàng với icon
code = code.replace(
  /<div className=\{`inline-flex p-5 rounded-2xl mb-6 \$\{zoneData\[activeZone\]\.color\}`\}>\n\s*\{zoneData\[activeZone\]\.icon\}\n\s*<\/div>\n\s*<h3 className="text-3xl font-heading font-black text-white uppercase tracking-tight mb-4">\n\s*\{getZoneTranslation\(activeZone\)\.name\}\n\s*<\/h3>/,
  `<div className="flex items-center gap-4 mb-6">
                      <div className={\`inline-flex p-4 rounded-2xl \${zoneData[activeZone].color}\`}>
                        {zoneData[activeZone].icon}
                      </div>
                      <h3 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
                        {getZoneTranslation(activeZone).name}
                      </h3>
                    </div>`
);

// Đổi màu nền bên phải để thích ứng sáng tối
code = code.replace(
  /className="bg-slate-900\/80 backdrop-blur-xl border border-white\/10 rounded-3xl p-8 shadow-2xl w-full flex flex-col"/,
  'className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl w-full flex flex-col"'
);

// Sửa màu text bên phải để thích ứng
code = code.replace(
  /text-3xl font-heading font-black text-white uppercase tracking-tight/,
  'text-3xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight'
);

code = code.replace(
  /text-slate-300 mb-8 text-lg leading-relaxed/,
  'text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed'
);

code = code.replace(
  /text-base font-bold text-white uppercase tracking-wider mb-5 border-b border-white\/10 pb-3/,
  'text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5 border-b border-slate-200 dark:border-white/10 pb-3'
);

code = code.replace(
  /text-slate-200 text-lg/,
  'text-slate-700 dark:text-slate-200 text-lg'
);

// Sửa màu nền vùng chứa nút
code = code.replace(
  /className="inline-flex bg-slate-900 border border-white\/10 rounded-2xl p-1\.5 shadow-xl"/,
  'className="inline-flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-1.5 shadow-xl"'
);

// Sửa màu các nút zone nhỏ
code = code.replace(
  /'bg-slate-900 text-slate-400 border-white\/5 hover:bg-slate-800 hover:text-slate-200'/,
  '\'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200\''
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('GymFloorPlan adapted.');
