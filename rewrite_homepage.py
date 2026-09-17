import re

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# Make all thumbnail icons w-12 h-12 and icon size 24
content = content.replace('w-16 h-16 rounded-2xl', 'w-12 h-12 rounded-xl')
content = content.replace('size={32}', 'size={24}')

# A1
a1_regex = r'<section className="py-20 sm:py-28 bg-white dark:bg-\[\#181818\] border-y border-slate-200 dark:border-white/10 transition-colors">\s*<FadeIn>\s*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">\s*<div>'
a1_replacement = """<section className="py-20 sm:py-28 bg-white dark:bg-[#181818] border-y border-slate-200 dark:border-white/10 transition-colors">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7">"""
content = re.sub(a1_regex, a1_replacement, content)

a1_img_regex = r'<div className="relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">\s*<img src="https://images\.unsplash\.com/photo-1534438327276-14e5300c3a48\?auto=format&fit=crop&w=1000&q=80" alt="Awareness" className="w-full h-full object-cover" />\s*</div>'
a1_img_replacement = """<div className="lg:col-span-5 relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80" alt="Awareness" className="w-full h-full object-cover" />
              </div>"""
content = re.sub(a1_img_regex, a1_img_replacement, content)

# A2
a2_regex = r'<section className="py-20 sm:py-28 bg-slate-50 dark:bg-\[\#121212\] transition-colors">\s*<FadeIn>\s*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-col-reverse lg:flex-row-reverse">\s*<div>'
a2_replacement = """<section className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 lg:order-last">"""
content = re.sub(a2_regex, a2_replacement, content)

a2_img_regex = r'<div className="relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">\s*<img src="https://images\.unsplash\.com/photo-1571019614242-c5c5dee9f50b\?auto=format&fit=crop&w=1000&q=80" alt="Ask Phase" className="w-full h-full object-cover" />\s*</div>'
a2_img_replacement = """<div className="lg:col-span-5 lg:order-first relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80" alt="Ask Phase" className="w-full h-full object-cover" />
              </div>"""
content = re.sub(a2_img_regex, a2_img_replacement, content)

# A3
a3_regex = r'<section className="py-20 sm:py-28 bg-white dark:bg-\[\#181818\] border-y border-slate-200 dark:border-white/10 transition-colors">\s*<FadeIn>\s*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">\s*<div>'
a3_replacement = """<section className="py-20 sm:py-28 bg-white dark:bg-[#181818] border-y border-slate-200 dark:border-white/10 transition-colors">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7">"""
content = re.sub(a3_regex, a3_replacement, content)

a3_img_regex = r'<div className="relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">\s*<img src="https://images\.unsplash\.com/photo-1540497077202-7c8a3999166f\?auto=format&fit=crop&w=1000&q=80" alt="Act Phase" className="w-full h-full object-cover" />\s*</div>'
a3_img_replacement = """<div className="lg:col-span-5 relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80" alt="Act Phase" className="w-full h-full object-cover" />
              </div>"""
content = re.sub(a3_img_regex, a3_img_replacement, content)


# Make the h2 text slightly smaller to ensure it stays on one line on most desktop screens
content = content.replace(
    'h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-brand-orange mb-6"',
    'h2 className="text-[28px] sm:text-[32px] xl:text-[40px] tracking-tight font-heading font-black uppercase italic text-brand-orange mb-6 leading-tight whitespace-pre-wrap sm:whitespace-nowrap lg:whitespace-normal xl:whitespace-nowrap"'
)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)
