(function($){
  $(document).ready(function(){
    function setup(){
      if($(window).width() <= 768){
        $('.FooterNew-link-content').hide();
      } else {
        $('.FooterNew-link-content').show();
      }
    }
    setup();
    $(window).on('resize', setup);
    $('.FooterNew-link-title').on('click keypress', function(e){
      if(e.type === 'click' || e.key === 'Enter' || e.key === ' '){
        if($(window).width() <= 768){
          var content = $(this).next('.FooterNew-link-content');
          content.slideToggle(200);
          e.preventDefault();
        }
      }
    });
  });
})(jQuery);
