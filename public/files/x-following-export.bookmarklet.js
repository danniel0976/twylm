// X/Twitter Following List Exporter - Bookmarklet
// Drag this to your bookmarks bar, then click while on your following page
// Usage: Go to https://twitter.com/YOUR_HANDLE/following then click bookmark

javascript:(function(){
  (async function extractFollowing() {
    const usernames = new Set();
    let lastCount = 0;
    let scrollAttempts = 0;
    const maxScrolls = 50;
    
    console.log('🐺 X Following Exporter starting...');
    
    // Scroll and collect
    while (scrollAttempts < maxScrolls) {
      const cards = document.querySelectorAll('[data-testid="UserCell"]');
      cards.forEach(card => {
        const link = card.querySelector('a[href^="/"]');
        if (link) {
          const username = link.getAttribute('href').replace('/', '');
          if (username && !username.includes('/')) {
            usernames.add(username);
          }
        }
      });
      
      console.log(`Scroll ${scrollAttempts}: ${usernames.size} accounts collected`);
      
      if (usernames.size === lastCount && scrollAttempts > 5) {
        console.log('No new accounts - likely reached end');
        break;
      }
      
      lastCount = usernames.size;
      scrollAttempts++;
      
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 800));
    }
    
    // Create download
    const content = Array.from(usernames).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-following-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Exported ${usernames.size} accounts to ${a.download}`);
    alert(`🐺 Exported ${usernames.size} accounts!\nFile: ${a.download}`);
  })();
})();
