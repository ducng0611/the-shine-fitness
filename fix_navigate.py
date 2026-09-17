import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace currentPath and navigateTo with useLocation and useNavigate from react-router-dom
old_nav = """  // URL Routing: /admin dedicated for Admin, all other paths strictly customer website
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);"""

new_nav = """  // URL Routing with react-router-dom
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const navigateTo = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };"""

content = content.replace(old_nav, new_nav)

# Also fix the Links in navigation
# Old: <a href={`#${link.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(link.id); setMobileMenuOpen(false); }} className={`relative font-heading font-bold uppercase tracking-wider text-sm transition-all duration-300 ${ currentPath === `/${link.id}` ? 'text-brand-orange scale-105' : 'text-slate-600 dark:text-slate-300 hover:text-brand-orange hover:scale-105' }`} >
# Wait, let's just find `scrollToSection` and remove it, since we are doing `navigateTo(link.path)`.
# Let's replace scrollToSection with navigateTo

# Wait, we need to fix the nav mapping
# Let's write a targeted replacement
content = re.sub(
    r"onClick=\{\(e\) => \{\s*e\.preventDefault\(\);\s*scrollToSection\(link\.id\);\s*\}\}",
    "onClick={(e) => { e.preventDefault(); navigateTo(link.path); }}",
    content
)
content = re.sub(
    r"onClick=\{\(e\) => \{\s*e\.preventDefault\(\);\s*scrollToSection\(link\.id\);\s*setMobileMenuOpen\(false\);\s*\}\}",
    "onClick={(e) => { e.preventDefault(); navigateTo(link.path); setMobileMenuOpen(false); }}",
    content
)

# And active link check: currentPath === `/${link.id}` should be currentPath === link.path
content = content.replace("currentPath === `/${link.id}`", "currentPath === link.path")
content = content.replace("currentPath === '/'", "currentPath === '/'") # ok

with open('src/App.tsx', 'w') as f:
    f.write(content)

