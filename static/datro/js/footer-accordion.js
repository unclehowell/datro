document.addEventListener('DOMContentLoaded', function () {
  function init() {
    document.querySelectorAll('.FooterNew-link-section').forEach(function (sec) {
      if (window.innerWidth <= 768) {
        sec.classList.remove('is-active');
      } else {
        sec.classList.add('is-active');
      }
    });
  }

  init();
  window.addEventListener('resize', init);

  document.querySelectorAll('.FooterNew-link-title').forEach(function (title) {
    function toggle(event) {
      if (window.innerWidth <= 768) {
        event.preventDefault();
        var sec = title.closest('.FooterNew-link-section');
        if (sec) sec.classList.toggle('is-active');
      }
    }

    title.addEventListener('click', toggle);
    title.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        toggle(e);
      }
    });
  });
});
