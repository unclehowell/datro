var toggleAnimationSpeed;
var itemSelector;
var foundItems;
var cssActiveClass;
var openLinkWithEnterKey;
var searchTextBoxSelector;
var noItemsFoundSelector;

function initializeListSearch(data) {
    if (data === undefined || data === null) { setDefaultValues(); return; }

    if (typeof (data.toggleAnimationSpeed) !== 'undefined') toggleAnimationSpeed = data.toggleAnimationSpeed;
    else toggleAnimationSpeed = 250;

    if (typeof (data.cssActiveClass) !== 'undefined') cssActiveClass = data.cssActiveClass;
    else cssActiveClass = 'active';

    if (typeof (data.itemSelector) !== 'undefined') itemSelector = data.itemSelector;
    else itemSelector = '.collection-item';

    if (typeof (data.openLinkWithEnterKey) !== 'undefined') openLinkWithEnterKey = data.openLinkWithEnterKey;
    else openLinkWithEnterKey = false;

    if (typeof (data.searchTextBoxSelector) !== 'undefined') searchTextBoxSelector = data.searchTextBoxSelector;
    else searchTextBoxSelector = '#search-box';

    if (typeof (data.noItemsFoundSelector) !== 'undefined') noItemsFoundSelector = data.noItemsFoundSelector;
    else noItemsFoundSelector = '.no-apps-found';
}

function setDefaultValues() {
    toggleAnimationSpeed = 250;
    itemSelector = '.collection-item';
    cssActiveClass = 'active';
    openLinkWithEnterKey = false;
    searchTextBoxSelector = '#search-box';
    noItemsFoundSelector = '.no-apps-found';
}

function searchListItems(searchText) {
    if (searchText === '') {
        resetSearch();
        $(noItemsFoundSelector).hide();
        return;
    }

    foundItems = findItemsInList(searchText);

    if (foundItems.length > 0 && openLinkWithEnterKey) {
        foundItems[0].addClass(cssActiveClass);
        $(noItemsFoundSelector).hide();
    } 
    else
        $(noItemsFoundSelector).show();
}

function resetSearch() {
    $(itemSelector).slideDown(toggleAnimationSpeed);
    $(itemSelector).removeClass(cssActiveClass);
    foundItems = $(itemSelector);
}

function findItemsInList(searchText) {
    var list = $(itemSelector);
    var result = [];

    for (var i = 0; i < list.length; i++) {
        var element = list[i];
        $(element).removeClass(cssActiveClass);

        if ($(element).children('a').html().toLowerCase().indexOf(searchText.toLowerCase()) < 0)
            $(element).slideUp(toggleAnimationSpeed);
        else {
            result.push($(element));
            $(element).slideDown(toggleAnimationSpeed);
        }
    }

    return result;
}

function selectNextItem(direction) {
    if (!openLinkWithEnterKey) return;

    var activeItem = $(itemSelector + '.' + cssActiveClass);

    if (activeItem.length === 0) {
        if (direction === 'next') $(foundItems[0]).addClass(cssActiveClass);
        if (direction === 'prev') $(foundItems[foundItems.length - 1]).addClass(cssActiveClass);
    }
    else {
        var current = $(itemSelector + '.' + cssActiveClass);
        current.removeClass(cssActiveClass);

        if (direction === 'next') current.nextAll(itemSelector + ':visible').first().addClass(cssActiveClass);
        if (direction === 'prev') current.prevAll(itemSelector + ':visible').first().addClass(cssActiveClass);
    }
}

function openLink() {
    if (!openLinkWithEnterKey) return;

    var link = $(itemSelector + '.' + cssActiveClass).first().children('a').attr('href');
    if (link !== undefined || link === null) document.location.href = link;
}

$(document).ready(function () {
    resetSearch();

    $(searchTextBoxSelector).bind('input propertychange', function () {
        searchListItems($(this).val());
    });

    $(searchTextBoxSelector).keydown(function (event) {
        if (event.keyCode === 40) selectNextItem('next');
        if (event.keyCode === 38) selectNextItem('prev');
        if (event.keyCode === 13) openLink();
    });
});
