/**
* version 1.1.0
* upgrades 
* - fade animation on open and close
* - open method. can open modal without binding link
* - possible to open modal with "POST". nessecary when need to send large amount of data to modal
*/

(function ($) {

    $.modalLinkDefaults = {
            height: 600,
            width: 900,
            showTitle: true,
            showClose: true,
            overlayOpacity: 0.6,
            method: "GET", // GET, POST, REF, CLONE
            onHideScroll: function () { },
            onShowScroll: function () { }
    };

    function hideBodyScroll(cb) {
        var w = $("body").outerWidth();
        $("body").css({ overflow: "hidden" });
        var w2 = $("body").outerWidth();
        $("body").css({ width: w });

        if (typeof cb == "function") {
            cb(w2 - w)
        }
        // $.modalLink.onHideScroll(w2 - w);

        //console.log("scrollbar width is: " + diff + "px");
    }

    function showBodyScroll(cb) {
        var $body = $("body");
        var w = $body.outerWidth();
        $body.css({ width: '', overflow: '' });
        var w2 = $body.outerWidth();

        if (typeof cb == "function") {
            cb(w - w2);
        }
        // $.modalLink.onShowScroll(w - w2);
    }

    function addUrlParam(url, name, value) {
        return appendUrl(url, name + "=" + value);
    }

    function appendUrl(url, data) {
        return url + (url.indexOf("?") < 0 ? "?" : "&") + data;
    }


    var methods = {
        init: function (options) {
            
            var settings = $.extend({}, $.modalLinkDefaults);
            $.extend(settings, options);

            return this.each(function () {
                var $link = $(this);
                
                // already bound
                if ($link.hasClass("sparkling-modal-link"))
                    return;
                
                // mark as bound
                $link.addClass("sparkling-modal-link");

                $link.click(function (e) {
                    e.preventDefault();
                    methods.open($link, settings);
                    return false;
                });
            });
        },
        
        close: function (cb) {

            var $container = $(".sparkling-modal-container");

            var $link = $container.data("modallink");

            if (!$link) {
                return;
            }

            $link.trigger("modallink.close");

            var $overlay = $container.find(".sparkling-modal-overlay");
            var $content = $container.find(".sparkling-modal-frame");

            $overlay.fadeTo("fast", 0);
            $content.fadeTo("fast", 0, function () {
                $container.remove();
                showBodyScroll(cb);

                if (typeof cb == "function") {
                    cb();
                }
            });
        },
        
        open: function ($link, options) {

            options = options || {};
            var url, title;

            url = $link.attr("href") || options.url;
            title = $link.attr("modal-title") // deprecated - use data-ml-title instead
                || $link.attr("data-ml-title")
                || $link.attr("title")
                || $link.text()
                || options.title;
            
            var settings = $.extend({}, $.modalLinkDefaults);
            $.extend(settings, options);

            var dataWidth = $link.attr("data-ml-width");
            if (dataWidth) {
                settings.width = parseInt(dataWidth);
            }
            var dataHeight = $link.attr("data-ml-height");
            if (dataHeight) {
                settings.height = parseInt(dataHeight);
            }

            if (settings.method !== "CLONE" && url.length > 0 && url[0] === "#") {
                settings.method = "REF";
            }

            var data = {};

            if (typeof settings.data != 'undefined') {
                if (typeof settings.data == "function") {
                    data = settings.data();
                }
                else {
                    data = settings.data;
                }
                
                if (settings.method === "GET") {
                    if (typeof data == "object") {
                        for (var i in data) {
                            if (data.hasOwnProperty(i)) {
                                url = addUrlParam(url, i, data[i]);
                            }
                        }
                    } else if (typeof data != "undefined") {
                        url = appendUrl(url, data);
                    }
                }
            }

            url = addUrlParam(url, "__inmodal", "true");

            var $container = $("<div class=\"sparkling-modal-container\"></div>");
            $container.data("modallink", $link);

            var $overlay = $("<div class=\"sparkling-modal-overlay\"></div>");
            $overlay.css({ position: 'fixed', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', zIndex: 999 });
            $overlay.appendTo($container);

            var $content = $("<div class=\"sparkling-modal-frame\"></div>")
                .css("opacity", 0)
                .css({ zIndex: 1000, position: 'fixed', display: 'inline-block' })
                .css({ left: '50%', marginLeft: -settings.width / 2 })
                .css({ top: '50%', marginTop: -settings.height / 2 })
                .appendTo($container);

            $("body").append($container);

            if (settings.showTitle)
            {
                var $title = $("<div class=\"sparkling-modal-title\"></div>");
                $title.appendTo($content);
                $title.append($("<span></span>").html(title));

                if (settings.showClose) {
                    var $closeButton = $("<div class=\"sparkling-modal-close\"><div class='i-close'><div class='i-close-h' /><div class='i-close-v' /></div></div>");
                    $closeButton.appendTo($title);
                    $closeButton.click(methods.close);
                }
                
                $title.append("<div style=\"clear: both;\"></div>");
            }
            var $iframeContainer = $("<div class=\"sparkling-modal-content\"></div>");
            $iframeContainer.appendTo($content);

            var $iframe;
            if (settings.method == "REF") {
                $iframe = $("<div />");
                $iframe.css("overflow", "auto");

                var $ref = $(url);
                var id = "ref_" + new Date().getTime();
                var $ph = $("<div id='" + id + "' />");
                $ph.insertAfter($ref);

                $ref.appendTo($iframe);

                $link.on("modallink.close", function() {
                    $ph.replaceWith($ref);
                });

            } else {
                $iframe = $("<iframe frameborder=0 id='modal-frame' name='modal-frame'></iframe>");
            }

            $iframe.appendTo($iframeContainer);
            $iframe.css({ width: settings.width, height: settings.height });

            if (settings.method == "CLONE") {
                console.log(url);
                var $inlineContent = $(url);
                console.log($inlineContent);

                var iFrameDoc = $iframe[0].contentDocument || $iframe[0].contentWindow.document;
                iFrameDoc.write($inlineContent.html());
                iFrameDoc.close();
            }
            else if (settings.method == "GET") {
                $iframe.attr("src", url);
            }

            $content.css({ marginTop: -($content.outerHeight(false) / 2) });

            $overlay.fadeTo("fast", settings.overlayOpacity);
            $content.fadeTo("fast", 1);

            if (settings.method == "POST") {
                
                var $form = settings.$form;
                if ($form && $form instanceof jQuery)
                {
                    var originalTarget = $form.attr("target"); 
                    $form
                        .attr("target", "modal-frame")
                        .data("submitted-from-modallink", true)
                        .submit()
                }
                else
                {
                    $form = $("<form />")
                        .attr("action", url)
                        .attr("method", "post")
                        .attr("target", "modal-frame")
                        .css({ display: 'none'});

                    $("<input />").attr({ type: "hidden", name: "__sparklingModalInit", value: 1 }).appendTo($form);

                    if ($.isArray(data)) {
                        for (var i in data) {
                            $("<input />").attr({ type: "hidden", name: data[i].name, value: data[i].value }).appendTo($form);
                        }
                    }
                    else
                    {
                        for (var i in data) {
                            $("<input />").attr({ type: "hidden", name: i, value: data[i] }).appendTo($form);
                        }
                    }

                    $form
                        .appendTo("body")
                        .submit();

                    $form.remove();
                }
            }

            hideBodyScroll(settings.onHideScroll);
        }
    };

    $.fn.modalLink = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.modalLink');
            return this;
        }
    };
    
    $.modalLink = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.modalLink');
            return this;
        }
    };

    $.modalLink.open = function(url, options) {
        options = $.extend({}, options);
        options.url = url;
        methods["open"].call(this, $("<a />"), options);
    };

})(jQuery);


$(document).keyup(function(e) {

    if (e.keyCode == 27) {
        $.modalLink("close");
    }   
});