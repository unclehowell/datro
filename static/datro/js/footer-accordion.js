(function($){
  $(function(){
    function init(){
      if($(window).width() <= 768){
        $('.FooterNew-link-section').removeClass('is-active');
      } else {
        $('.FooterNew-link-section').addClass('is-active');
      }
    }

    init();
    $(window).on('resize', init);

    $('.FooterNew-link-title').on('click keypress', function(e){
      if(e.type === 'click' || e.key === 'Enter' || e.key === ' '){
        if($(window).width() <= 768){
          var section = $(this).closest('.FooterNew-link-section');
          section.toggleClass('is-active');
          e.preventDefault();
        }
      }
    });
  });
})(jQuery);
