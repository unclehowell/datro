(function() {
  var ONLINE_LIBRARY_URL = 'https://library.datro.xyz/';

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

  function refreshLibraryLinks(context) {
    var scope = context || document;
    var links = scope.querySelectorAll('a[data-featherlight][href*="library"], a[data-featherlight][data-library-href]');
    links.forEach(function(link) {
      var originalHref = rememberOriginalHref(link);
      link.setAttribute('href', resolveLibraryHref(originalHref));
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    refreshLibraryLinks(document);
  });

  function initWithjQuery($) {
    var $dropdownWrapper = $('.release-dropdown-wrapper');
    if ($dropdownWrapper.length) {
      var $initialSelect = $dropdownWrapper.find('.release-select-initial');
      var $secondarySelect = $dropdownWrapper.find('.release-select-secondary');
      var $backButton = $dropdownWrapper.find('.release-back-button');

      $secondarySelect.prop('hidden', true).prop('disabled', true);
      $backButton.addClass('is-hidden').attr('aria-hidden', 'true');

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
        $backButton.removeClass('is-hidden').addClass('is-visible').attr('aria-hidden', 'false');
        $secondarySelect.prop('hidden', false).prop('disabled', false).focus();
      });

      $backButton.on('click', function() {
        $initialSelect.prop('hidden', false).val('');
        $secondarySelect.prop('hidden', true).prop('disabled', true).val('');
        $backButton.removeClass('is-visible').addClass('is-hidden').attr('aria-hidden', 'true');
        $initialSelect.focus();
      });
    }

    $('.release-slider').each(function() {
      var $slider = $(this);
      var $items = $slider.find('.release-item');

      $items.each(function(index) {
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
    });

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
        afterClose: function() {
          $padlock.text(originalIcon).removeClass('is-unlocked');
        }
      };

      if (window.jQuery && jQuery.featherlight) {
        jQuery.featherlight(featherlightOptions);
      }
    });

    refreshLibraryLinks(document);
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
