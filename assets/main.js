(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
        if (!link) return;
        links.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIo.observe(s); });
  }
})();
