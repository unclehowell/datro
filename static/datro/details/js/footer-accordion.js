(function(){
  const mq = 768;

  function setupSections() {
    document.querySelectorAll('.FooterNew-link-section').forEach(sec => {
      const content = sec.querySelector('.FooterNew-link-content');
      if(!content) return;
      if (window.innerWidth > mq) {
        sec.classList.add('is-active');
        content.style.maxHeight = '';
      } else {
        sec.classList.remove('is-active');
        content.style.maxHeight = 0;
      }
    });
  }

  function toggleSection(sec) {
    const content = sec.querySelector('.FooterNew-link-content');
    if(!content) return;
    const open = sec.classList.contains('is-active');
    if(open){
      sec.classList.remove('is-active');
      content.style.maxHeight = 0;
    } else {
      sec.classList.add('is-active');
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupSections();
    window.addEventListener('resize', setupSections);

    document.querySelectorAll('.FooterNew-link-section').forEach(sec => {
      const title = sec.querySelector('.FooterNew-link-title');
      if(!title) return;
      const handler = (e) => {
        if(window.innerWidth <= mq){
          e.preventDefault();
          toggleSection(sec);
        }
      };
      title.addEventListener('click', handler);
      title.addEventListener('touchstart', handler);
      title.addEventListener('keypress', e => {
        if(window.innerWidth <= mq && (e.key === 'Enter' || e.key === ' ')){
          e.preventDefault();
          toggleSection(sec);
        }
      });
    });
  });
})();
