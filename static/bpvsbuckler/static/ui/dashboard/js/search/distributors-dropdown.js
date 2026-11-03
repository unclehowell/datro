 function setCountry(code){
        if(code || code==''){
            var text = jQuery('a[cunt_code="'+code+'"]').html();
            $(".dropdown2 dt a span").html(text);
        }
    }
    $(document).ready(function() {
        $(".dropdown2 img.flag").addClass("flagvisibility");

        $(".dropdown2 dt a").click(function() {
            $(".dropdown2 dd ul").toggle();
        });

        $(".dropdown2 dd ul li a").click(function() {
            //console.log($(this).html())
            var text = $(this).html();
            $(".dropdown2 dt a span").html(text);
            $(".dropdown2 dd ul").hide();
            $("#result").html("Selected value is: " + getSelectedValue("country-select"));
        });

        function getSelectedValue(id) {
            //console.log(id,$("#" + id).find("dt a span.value").html())
            return $("#" + id).find("dt a span.value").html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass("dropdown2"))
                $(".dropdown2 dd ul").hide();
        });


        $("#flagSwitcher").click(function() {
            $(".dropdown2 img.flag").toggleClass("flagvisibility");
        });
    });