 function setCountry(code){
        if(code || code==''){
            var text = jQuery('a[cunt_code="'+code+'"]').html();
            $(".dropdown3 dt a span").html(text);
        }
    }
    $(document).ready(function() {
        $(".dropdown3 img.flag").addClass("flagvisibility");

        $(".dropdown3 dt a").click(function() {
            $(".dropdown3 dd ul").toggle();
        });

        $(".dropdown3 dd ul li a").click(function() {
            //console.log($(this).html())
            var text = $(this).html();
            $(".dropdown3 dt a span").html(text);
            $(".dropdown3 dd ul").hide();
            $("#result").html("Selected value is: " + getSelectedValue("country-select"));
        });

        function getSelectedValue(id) {
            //console.log(id,$("#" + id).find("dt a span.value").html())
            return $("#" + id).find("dt a span.value").html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass("dropdown3"))
                $(".dropdown3 dd ul").hide();
        });


        $("#flagSwitcher").click(function() {
            $(".dropdown3 img.flag").toggleClass("flagvisibility");
        });
    });