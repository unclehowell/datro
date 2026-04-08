 function setCountry(code){
        if(code || code==''){
            var text = jQuery('a[cunt_code="'+code+'"]').html();
            $(".featuresdrop dt a span").html(text);
        }
    }
    $(document).ready(function() {
        $(".allfeaturesdrop img.flag").addClass("flagvisibility");

        $(".allfeaturesdrop dt a").click(function() {
            $(".allfeaturesdrop dd ul").toggle();
        });

        $(".allfeaturesdrop dd ul li a").click(function() {
            //console.log($(this).html())
            var text = $(this).html();
            $(".allfeaturesdrop dt a span").html(text);
            $(".allfeaturesdrop dd ul").hide();
            $("#result").html("Selected value is: " + getSelectedValue("allfeaturesdrop-select"));
        });

        function getSelectedValue(id) {
            //console.log(id,$("#" + id).find("dt a span.value").html())
            return $("#" + id).find("dt a span.value").html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass("allfeaturesdrop"))
                $(".allfeaturesdrop dd ul").hide();
        });


        $("#flagSwitcher").click(function() {
            $(".allfeaturesdrop img.flag").toggleClass("flagvisibility");
        });
    });