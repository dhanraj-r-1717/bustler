chrome.contextMenus.create({id: "selectedText", title: `Add selected text to bustler"`, contexts:["selection"]});
chrome.contextMenus.create({id: "URL", title: `Add current page url to bustler"`, contexts:[]});

chrome.contextMenus.onClicked.addListener(function (clickData) {
	if(clickData.menuItemId == "selectedText" && clickData.selectionText) {
        alert(clickData.selectionText);
	}
	if(clickData.menuItemId == "URL" && clickData.selectionText) {
        chrome.tabs.create({url: URL});
	}
});