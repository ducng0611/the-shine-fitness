const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert state
if (!code.includes('isAutoPlayEnabled')) {
  code = code.replace(
    /const \[showAllClips, setShowAllClips\] = useState\(false\);/,
    `const [showAllClips, setShowAllClips] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(() => {
    return localStorage.getItem('the_shine_autoplay') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('the_shine_autoplay', String(isAutoPlayEnabled));
  }, [isAutoPlayEnabled]);`
  );
}

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Autoplay state added.');
