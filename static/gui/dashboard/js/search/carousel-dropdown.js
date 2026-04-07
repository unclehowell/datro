 function setCountry(code){
        if(code || code==''){
            var text = jQuery('a[cunt_code="'+code+'"]').html();
            $(".carousel-dropdown dt a span").html(text);
        }
    }
    $(document).ready(function() {
        $(".carousel-dropdown img.flag").addClass("flagvisibility");

        $(".carousel-dropdown dt a").click(function() {
            $(".carousel-dropdown dd ul").toggle();
        });

        $(".carousel-dropdown dd ul li a").click(function() {
            //console.log($(this).html())
            var text = $(this).html();
            $(".carousel-dropdown dt a span").html(text);
            $(".carousel-dropdown dd ul").hide();
            $("#result").html("Selected value is: " + getSelectedValue("country-select"));
        });

        function getSelectedValue(id) {
            //console.log(id,$("#" + id).find("dt a span.value").html())
            return $("#" + id).find("dt a span.value").html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass("carousel-dropdown"))
                $(".carousel-dropdown dd ul").hide();
        });


        $("#flagSwitcher").click(function() {
            $(".carousel-dropdown img.flag").toggleClass("flagvisibility");
        });
    });