// X Media Scraper - Bookmarklet
// Drag to bookmarks bar, then click while on a Twitter profile page
// Usage: Go to https://twitter.com/USERNAME or https://twitter.com/USERNAME/media then click bookmarklet

javascript:(function(){
  (async function scrapeMedia() {
    const username = window.location.pathname.split('/')[1];
    if (!username) {
      alert('❌ Go to a profile page first! (e.g., twitter.com/username)');
      return;
    }
    
    console.log('🐺 X Media Scraper starting for @' + username);
    
    const mediaUrls = new Set();
    let lastCount = 0;
    let scrollAttempts = 0;
    const maxScrolls = 100;
    
    function extractMedia() {
      // Extract images from tweets
      document.querySelectorAll('[data-testid="tweet"]').forEach(tweet => {
        // Images
        tweet.querySelectorAll('img[src*="twimg.com"]').forEach(img => {
          const url = img.src.split('?')[0]; // Remove query params
          if (url.includes('media')) {
            mediaUrls.add(url);
          }
        });
        
        // Videos
        tweet.querySelectorAll('video[src*="twimg.com"]').forEach(vid => {
          mediaUrls.add(vid.src);
        });
      });
    }
    
    // Auto-scroll and collect
    while (scrollAttempts < maxScrolls) {
      extractMedia();
      console.log(`Scroll ${scrollAttempts}: ${mediaUrls.size} media found`);
      
      if (mediaUrls.size === lastCount && scrollAttempts > 10) {
        console.log('No new media - likely reached end');
        break;
      }
      
      lastCount = mediaUrls.size;
      scrollAttempts++;
      
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 1500));
    }
    
    if (mediaUrls.size === 0) {
      alert('📭 No media found. Try scrolling manually first, then run again.');
      return;
    }
    
    console.log(`✅ Found ${mediaUrls.size} media items`);
    
    // Create download - list of URLs
    const content = `# Media from @${username}\n# Scraped: ${new Date().toISOString()}\n\n` + Array.from(mediaUrls).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-media-urls-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`🐺 Found ${mediaUrls.size} media items!\n\nDownloaded: ${a.download}\n\nUse a download manager to batch download all URLs:\n- wget: wget -i ${a.download}\n- curl: cat ${a.download} | xargs -n 1 curl -O\n- Or use browser extension like "Simple Mass Downloader"`);
  })();
})();
