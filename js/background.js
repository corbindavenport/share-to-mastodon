// Initialize welcome message and context menu entry on extension load
chrome.runtime.onInstalled.addListener(function (details) {
	// Initialize context menu
	chrome.contextMenus.create({
		id: "share-to-mastodon",
		title: 'Share to Mastodon',
		contexts: ['selection', 'link', 'page']
	})
	// Show welcome message
	if (details.reason === 'install' || details.reason === 'update') {
		// Set message
		const notification = {
			type: 'basic',
			iconUrl: chrome.runtime.getURL('img/icon_x128.png'),
			title: 'Share to Mastodon ' + chrome.runtime.getManifest().version + ' installed!',
			buttons: [
				{
					title: 'Open Settings'
				},
				{
					title: 'Join Discord'
				}
			],
			message: "Click here to see what's new in this version."
		}
		// Send notification
		chrome.notifications.create(notification, () => {
			// Handle notification click
			chrome.notifications.onClicked.addListener(function () {
				//chrome.tabs.create({ url: 'https://corbin.io/' })
			})
			// Handle notification button clicks
			chrome.notifications.onButtonClicked.addListener(function (_, buttonIndex) {
				if (buttonIndex === 0) {
					chrome.runtime.openOptionsPage()
				} else if (buttonIndex === 1) {
					// Open Discord
					chrome.tabs.create({ url: 'https://discord.com/invite/59wfy5cNHw' })
				}
			})
		})
	}
})

// Function for creating share popup
function createPopup(serverDomain, shareLink, shareText, tab) {
	var popupPage = 'https://' + serverDomain + '/share?text=' + encodeURIComponent(shareText + '\n\n' + shareLink)
	var popupWidth = 500
	var popupHeight = 500
	var y = Math.round((tab.height / 2) - (popupHeight / 2))
	var x = Math.round((tab.width / 2) - (popupWidth / 2))
	console.log(popupWidth, popupHeight, y, x)
	chrome.windows.create({
		url: popupPage,
		width: popupWidth,
		height: popupHeight,
		left: x,
		top: y,
		type: 'popup'
	})
}

// Function for context menu search
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
	console.log(info, tab)
	if (info.menuItemId == "share-to-mastodon") {
		// Check if there is a saved server
		var server = await new Promise(function (resolve) {
			chrome.storage.sync.get(function (data) {
				resolve(data.userServer)
			})
		})
		// Open settings if needed
		if (!server) {
			chrome.runtime.openOptionsPage()
			return false
		}
		// Set link and description
		var shareLink = ''
		var shareText = ''
		if (info.linkUrl) {
			shareLink = info.linkUrl
			shareText = 'Type something here'
		} else if (info.selectionText) {
			shareLink = info.pageUrl
			shareText = '"' + info.selectionText + '"'
		} else {
			shareLink = info.pageUrl
			shareText = 'Type something here'
		}
		// Open popup
		createPopup(server, shareLink, shareText, tab)
	}
})

// Function for action button
chrome.action.onClicked.addListener(async function (tab) {
	// Check if there is a saved server
	var server = await new Promise(function (resolve) {
		chrome.storage.sync.get(function (data) {
			resolve(data.userServer)
		})
	})
	// Open settings if needed
	if (!server) {
		chrome.runtime.openOptionsPage()
		return false
	}
	// Open popup
	var shareLink = tab.url
	var shareText = tab.title
	createPopup(server, shareLink, shareText, tab)
})