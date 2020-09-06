/* Simulate an ajax-load with a delayed DOM insertion */

setTimeout(function() {
  var el = $('#image1');
  el.html('<img alt="First slide" class="first-slide" src="static/datro/img/carousel/image1.webp">');
  onLoad(el);
}, 100);

setTimeout(function() {
  var el = $('#image2');
  el.html('	<img alt="Second slide" class="second-slide" src="static/datro/img/carousel/image2.png">');
  onLoad(el);
}, 100);

setTimeout(function() {
  var el = $('#image3');
  el.html('<img alt="Third slide" class="third-slide" src="static/datro/img/carousel/image3.webp">');
  onLoad(el);
}, 100);



function onLoad(element) {
  $(element).addClass('loaded');
}
