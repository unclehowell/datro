(function() {
  var ONLINE_LIBRARY_URL = 'https://library.datro.xyz/';
  var TOPBAR_TEMPLATE = '' +
    '<div class="release-topbar" role="region" aria-label="Release roadmap">' +
    '  <div class="release-topbar-inner" id="release-controls">' +
    '    <div class="release-dropdown-wrapper">' +
    '      <button type="button" class="release-back-button" aria-label="Return to main options">&#8592; Back</button>' +
    '      <span class="v-h" id="release-primary-label">Select a starting option</span>' +
    '      <select class="release-select release-select-initial" id="release-select-initial" aria-labelledby="release-primary-label">' +
    '        <option value="">Choose an option</option>' +
    '        <option value="1">1</option>' +
    '        <option value="2">2</option>' +
    '        <option value="3">3</option>' +
    '      </select>' +
    '      <select class="release-select release-select-secondary" id="release-select-secondary" aria-label="Select a secondary option" hidden></select>' +
    '    </div>' +
    '    <div class="release-slider" role="tablist" aria-label="Release checkpoints">' +
    '      <div class="release-item is-active">' +
    '        <button type="button" class="release-toggle" role="tab" aria-selected="true">2010</button>' +
    '        <button type="button" class="release-padlock is-unlocked" aria-label="Open 2010 details" data-library-href="/library/">🔓</button>' +
    '      </div>' +
    '      <div class="release-item">' +
    '        <button type="button" class="release-toggle" role="tab" aria-selected="false">2020</button>' +
    '        <button type="button" class="release-padlock" aria-label="Open 2020 details" data-library-href="/library/">🔒</button>' +
    '      </div>' +
    '      <div class="release-item">' +
    '        <button type="button" class="release-toggle" role="tab" aria-selected="false">2030</button>' +
    '        <button type="button" class="release-padlock" aria-label="Open 2030 details" data-library-href="/library/">🔒</button>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '  <button type="button" class="release-collapse-button" aria-expanded="true" aria-controls="release-controls" title="Hide release controls">' +
    '    <span class="release-collapse-icon" aria-hidden="true">−</span>' +
    '    <span class="v-h">Toggle release controls</span>' +
    '  </button>' +
    '</div>';

  var topbarElement = null;

  function isOnlineLibrary() {
    var host = window.location && window.location.hostname ? window.location.hostname.toLowerCase() : '';
    return host && host.indexOf('datro.') !== -1;
  }

  function resolveLibraryHref(preferredHref) {
    if (isOnlineLibrary()) {
      return ONLINE_LIBRARY_URL;
    }
    if (preferredHref) {
      return preferredHref;
    }
    return '/library/';
  }

  function rememberOriginalHref(link) {
    if (!link.getAttribute('data-original-library-href')) {
      link.setAttribute('data-original-library-href', link.getAttribute('href'));
    }
    return link.getAttribute('data-original-library-href');
  }

  function linkTextIncludesLibrary(link) {
    var text = (link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return text === 'library';
  }

  function shouldUpdateLibraryLink(link) {
    if (!link || !link.getAttribute) {
      return false;
    }
    if (link.hasAttribute('data-library-link-ignore')) {
      return false;
    }
    if (link.hasAttribute('data-library-href')) {
      return true;
    }
    if (link.hasAttribute('data-featherlight')) {
      var originalHref = rememberOriginalHref(link);
      return /library\//i.test(originalHref || '');
    }
    return linkTextIncludesLibrary(link);
  }

  function refreshLibraryLinks(context) {
    var scope = context || document;
    var links = Array.prototype.slice.call(scope.querySelectorAll('a[href]'));
    links.forEach(function(link) {
      if (!shouldUpdateLibraryLink(link)) {
        return;
      }
      var originalHref = rememberOriginalHref(link);
      link.setAttribute('href', resolveLibraryHref(originalHref));
    });
  }

  function ensureTopbar() {
    if (topbarElement && document.body && document.body.contains(topbarElement)) {
      return topbarElement;
    }

    if (document.querySelector('.release-topbar')) {
      topbarElement = document.querySelector('.release-topbar');
    } else if (document.body) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = TOPBAR_TEMPLATE;
      topbarElement = wrapper.firstElementChild;
      if (topbarElement) {
        document.body.insertBefore(topbarElement, document.body.firstChild || null);
      }
    }

    if (topbarElement && document.body) {
      document.body.classList.add('has-release-topbar');
      requestAnimationFrame(updateTopbarLayout);
    }

    return topbarElement;
  }

  function updateTopbarLayout() {
    if (!topbarElement) {
      return;
    }
    var rect = topbarElement.getBoundingClientRect();
    var height = rect ? rect.height : 0;
    if (topbarElement.classList.contains('is-collapsed')) {
      var collapseButton = topbarElement.querySelector('.release-collapse-button');
      if (collapseButton) {
        var buttonRect = collapseButton.getBoundingClientRect();
        var styles = window.getComputedStyle(topbarElement);
        var paddingY = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
        var collapsedHeight = (buttonRect ? buttonRect.height : 0) + paddingY;
        if (collapsedHeight > 0) {
          height = collapsedHeight;
        }
      }
    }
    document.documentElement.style.setProperty('--release-topbar-height', height + 'px');
  }

  function initCollapseBehaviour(topbar) {
    if (!topbar) {
      return;
    }
    var collapseButton = topbar.querySelector('.release-collapse-button');
    if (!collapseButton) {
      return;
    }

    function setExpanded(expanded) {
      topbar.classList.toggle('is-collapsed', !expanded);
      collapseButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      collapseButton.setAttribute('title', expanded ? 'Hide release controls' : 'Show release controls');
      var icon = collapseButton.querySelector('.release-collapse-icon');
      if (icon) {
        icon.textContent = expanded ? '−' : '+';
      }
      requestAnimationFrame(updateTopbarLayout);
    }

    collapseButton.addEventListener('click', function() {
      var expanded = collapseButton.getAttribute('aria-expanded') !== 'false';
      setExpanded(!expanded);
    });

    setExpanded(true);
  }

  document.addEventListener('DOMContentLoaded', function() {
    refreshLibraryLinks(document);
    ensureTopbar();
    updateTopbarLayout();
  });

  window.addEventListener('resize', function() {
    updateTopbarLayout();
  });

  function initWithjQuery($) {
    var $topbar = $(ensureTopbar());
    if ($topbar.length) {
      initCollapseBehaviour($topbar.get(0));
    }

    var $dropdownWrapper = $topbar.find('.release-dropdown-wrapper');
    if ($dropdownWrapper.length) {
      var $initialSelect = $dropdownWrapper.find('.release-select-initial');
      var $secondarySelect = $dropdownWrapper.find('.release-select-secondary');
      var $backButton = $dropdownWrapper.find('.release-back-button');

      $secondarySelect.prop('hidden', true).prop('disabled', true);
      $backButton.removeClass('is-visible').attr('aria-hidden', 'true');

      $initialSelect.on('change', function() {
        var chosenValue = $(this).val();
        if (!chosenValue) {
          return;
        }
        $secondarySelect.empty();
        $secondarySelect.append($('<option>', { value: '', text: 'Select an option' }));
        for (var i = 1; i <= 3; i += 1) {
          var label = chosenValue + '.' + i;
          $secondarySelect.append($('<option>', { value: label, text: label }));
        }
        $initialSelect.prop('hidden', true);
        $backButton.addClass('is-visible').attr('aria-hidden', 'false');
        $secondarySelect.prop('hidden', false).prop('disabled', false).focus();
      });

      $backButton.on('click', function() {
        $initialSelect.prop('hidden', false).val('');
        $secondarySelect.prop('hidden', true).prop('disabled', true).val('');
        $backButton.removeClass('is-visible').attr('aria-hidden', 'true');
        $initialSelect.focus();
      });
    }

    var $slider = $topbar.find('.release-slider');
    if ($slider.length) {
      var $items = $slider.find('.release-item');

      $items.each(function() {
        var $item = $(this);
        var $toggle = $item.find('.release-toggle');
        $toggle.on('click', function() {
          $items.removeClass('is-active');
          $items.find('.release-toggle').attr('aria-selected', 'false');
          $item.addClass('is-active');
          $toggle.attr('aria-selected', 'true');
        });
      });

      $slider.on('keydown', function(event) {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
          return;
        }
        event.preventDefault();
        var $current = $items.filter('.is-active');
        var index = $items.index($current);
        if (index < 0) {
          index = 0;
        }
        if (event.key === 'ArrowRight' && index < $items.length - 1) {
          index += 1;
        } else if (event.key === 'ArrowLeft' && index > 0) {
          index -= 1;
        }
        $items.removeClass('is-active');
        $items.find('.release-toggle').attr('aria-selected', 'false');
        var $target = $items.eq(index);
        $target.addClass('is-active');
        $target.find('.release-toggle').attr('aria-selected', 'true').focus();
      });
    }

    $(document).on('click', '.release-padlock', function(event) {
      event.preventDefault();
      var $padlock = $(this);
      var $item = $padlock.closest('.release-item');
      var $toggle = $item.find('.release-toggle');
      var originalIcon = $padlock.attr('data-original-icon');
      if (!originalIcon) {
        originalIcon = ($padlock.text() || '🔒').trim();
        $padlock.attr('data-original-icon', originalIcon);
      }
      var unlockedIcon = $padlock.attr('data-unlocked-icon') || '🔓';
      var preferredHref = $padlock.attr('data-library-href') || '/library/';
      var popupHref = resolveLibraryHref(preferredHref);

      $padlock.text(unlockedIcon).addClass('is-unlocked');
      if ($item.length) {
        $item.addClass('is-active');
        $toggle.attr('aria-selected', 'true');
      }

      var featherlightOptions = {
        iframe: popupHref,
        iframeMaxWidth: '95%',
        iframeWidth: 1024,
        iframeHeight: 640,
        closeIcon: '×',
        afterClose: function() {
          $padlock.text(originalIcon).removeClass('is-unlocked');
        }
      };

      if (window.jQuery && jQuery.featherlight) {
        jQuery.featherlight(featherlightOptions);
      }
    });

    refreshLibraryLinks(document);
    updateTopbarLayout();
  }

  function attemptInit(attempts) {
    if (window.jQuery) {
      window.jQuery(initWithjQuery);
      return;
    }
    if (attempts > 20) {
      return;
    }
    window.setTimeout(function() {
      attemptInit((attempts || 0) + 1);
    }, 100);
  }

  attemptInit(0);
})();
