$(function(){
  var mq = 768;
  function init(){
    if(window.innerWidth > mq){
      $('.FooterNew-link-section').addClass('is-active');
      $('.FooterNew-link-content').css('max-height','');
    }else{
      $('.FooterNew-link-section').removeClass('is-active');
      $('.FooterNew-link-content').css('max-height',0);
    }
  }
  init();
  $(window).on('resize', init);
  $('.FooterNew-link-title').on('click keypress touchstart', function(e){
    if(window.innerWidth > mq) return;
    if(e.type === 'keypress' && e.which !== 13 && e.which !== 32) return;
    e.preventDefault();
    var section = $(this).closest('.FooterNew-link-section');
    var content = section.find('.FooterNew-link-content');
    section.toggleClass('is-active');
    if(section.hasClass('is-active')){
      content.css('max-height', content[0].scrollHeight + 'px');
    } else {
      content.css('max-height', 0);
    }
  });
});
