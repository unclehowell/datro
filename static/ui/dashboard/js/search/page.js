  videoLightning({
    elements: [
      {
        ".video-link": {
          autoplay: 1,
          easeOut: 1000,
          bdColor: "#ddd",
          bdOpacity: 0.6,
          glow: 20,
          glowColor: "#000"
        }
      },
      {
        ".video-link2": {
          autoplay: 1,
          bdColor: "#7FFF00",
          bdOpacity: 0.7,
          glow: 150,
          glowColor: "#fff",
          xColor: "#7FFF00",
          color: "#fff"
        }
      },
      {
        "#bare-iframe-link": {
          id: 'demo.html',
          frameColor: '#555',
          frameBorder: '3px solid #3A0372',
          bdOpacity: 0.9,
          glow: 0,
          xBgColor: '#3A0372',
          xColor: '#f5f5f5',
          xBorder: '3px solid #555'
        }
      }
    ]
  });
  $(function () {
      $(".video-link3").jqueryVideoLightning({
          id: "y-z-D1PJ1cMXs",
          autoplay: 1,
          controls: 0,
          bdColor: "#fff",
          bdOpacity: 1,
          xBgColor: 'transparent',
          xColor: 'transparent',
          glow: 0,
          width: 640,
          height: 360,
          showinfo: 0,
          fadeIn: 3000,
          frameColor: '#fff'
      });
  });
  $(function () {
      $(".video-link4").jqueryVideoLightning({
          id: 'y-26mMPKS83c4',
          autoplay: 1,
          startTime: 62,
          fadeIn: 0,
          bdColor: '#f5f5f5',
          bdOpacity: 1,
          glow: 20,
          glowColor: '#000',
          controls: 0,
          showinfo: 0,
          color: "white"
      });
  });
  $(function () {
      $(".video-link5").jqueryVideoLightning({
          autoplay: 1,
          playlist: "WkgWvaFrJv8,NCsihs3A_hM",
          bdColor: "#3A0372",
          bdOpacity: 0.8,
          glow: 50,
          glowColor: "#F1D6F5",
          color: "#fff",
          cover: 1
      });
  });
  $(function () {
      $(".video-link6").jqueryVideoLightning({
          autoplay: 1,
          controls: 0,
          width: "480px",
          height: "320px",
          popover: 1,
          peek: 1
      });
  });
  
	var words = document.getElementsByClassName('word');
var wordArray = [];
var currentWord = 0;

words[currentWords].style.wordSpacing = "10px";
for (var i = 0; i < words.length; i++) {
  splitLetters(words[i]);
}

function changeWord() {
  var cw = wordArray[currentWord];
  var nw = currentWord == words.length-1 ? wordArray[0] : wordArray[currentWord+1];
  for (var i = 0; i < cw.length; i++) {
    animateLetterOut(cw, i);
  }
  
  for (var i = 0; i < nw.length; i++) {
    nw[i].className = 'letter behind';
    nw[0].parentElement.style.opacity = 1;
    animateLetterIn(nw, i);
  }
  
  currentWord = (currentWord == wordArray.length-1) ? 0 : currentWord+1;
}

function animateLetterOut(cw, i) {
  setTimeout(function() {
		cw[i].className = 'letter out';
  }, i*80);
}

function animateLetterIn(nw, i) {
  setTimeout(function() {
		nw[i].className = 'letter in';
  }, 340+(i*80));
}

function splitLetters(word) {
  var content = word.innerHTML;
  word.innerHTML = '';
  var letters = [];
  for (var i = 0; i < content.length; i++) {
    var letter = document.createElement('span');
    letter.className = 'letter';
    letter.innerHTML = content.charAt(i);
    word.appendChild(letter);
    letters.push(letter);
  }
  
  wordArray.push(letters);
}

changeWord();
setInterval(changeWord, 3000);

	 
	 // Create a Stripe client.
var stripe = Stripe('pk_live_8WTX2ufon6TVxo2P5CcYUWzN');

// Create an instance of Elements.
var elements = stripe.elements();

// Custom styling can be passed to options when creating an Element.
// (Note that this demo uses a wider set of styles than the guide below.)
var style = {
  base: {
    color: '#32325d',
    lineHeight: '18px',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
};

// Create an instance of the card Element.
var card = elements.create('card', {style: style});

// Add an instance of the card Element into the `card-element` <div>.
card.mount('#card-element');