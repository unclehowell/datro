 function setCountry(code){
        if(code || code==''){
            var text = jQuery('a[cunt_code="'+code+'"]').html();
            $(".currencydrop dt a span").html(text);
        }
    }
    $(document).ready(function() {
        $(".currencydrop img.flag").addClass("flagvisibility");

        $(".currencydrop dt a").click(function() {
            $(".currencydrop dd ul").toggle();
        });

        $(".currencydrop dd ul li a").click(function() {
            //console.log($(this).html())
            var text = $(this).html();
            $(".currencydrop dt a span").html(text);
            $(".currencydrop dd ul").hide();
            $("#result").html("Selected value is: " + getSelectedValue("country-select"));
        });

        function getSelectedValue(id) {
            //console.log(id,$("#" + id).find("dt a span.value").html())
            return $("#" + id).find("dt a span.value").html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass("currencydrop"))
                $(".currencydrop dd ul").hide();
        });


        $("#flagSwitcher").click(function() {
            $(".currencydrop img.flag").toggleClass("flagvisibility");
        });
    });