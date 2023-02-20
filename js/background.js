// Initialize welcome message and context menu entry on extension load
chrome.runtime.onInstalled.addListener(function (details) {
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
				chrome.tabs.create({ url: 'https://corbin.io/introducing-share-to-mastodon/' })
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
	// Initialize context menu
	createContextMenu()
	// Migrate data if needed
	migrateOldData()
})

// Function for migrating data from version 1.0
// Version 1.0 saved a single server in a "userServer" string
async function migrateOldData() {
	var data = await chrome.storage.sync.get()
	if (data.userServer) {
		var oldServer = data.userServer
		console.log('Migrating server selection ' + oldServer + ' to new format...')
		// Move data
		await chrome.storage.sync.set({ serverList: [oldServer] })
		// Delete old data
		await chrome.storage.sync.remove('userServer')
		console.log('Migration complete!')
	}
}

// Function for creating context menu entries
async function createContextMenu() {
	// Remove existing entries if they exist
	await chrome.contextMenus.removeAll()
	// Create a menu entry for each saved server
	var data = await chrome.storage.sync.get()
	if ((!data.serverList) || (data.serverList.length === 0)) {
		// Create generic menu item because no servers are set yet
		chrome.contextMenus.create({
			id: "generic",
			title: 'Share to Mastodon',
			contexts: ['selection', 'link', 'page']
		})
	} else {
		// Create menu item for each saved server
		for (server in data.serverList) {
			var serverUrl = data.serverList[server]
			chrome.contextMenus.create({
				id: serverUrl,
				title: 'Share to ' + serverUrl,
				contexts: ['selection', 'link', 'page']
			})
		}
		// Add seperator and link to settings
		chrome.contextMenus.create({
			id: 'none',
			type: 'separator',
			contexts: ['selection', 'link', 'page']
		})
		chrome.contextMenus.create({
			id: 'edit-servers',
			title: 'Edit server list',
			contexts: ['selection', 'link', 'page']
		})
	}
}

// Function for handling context menu clicks
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
	// Open settings page if requested
	if (info.menuItemId === 'edit-servers') {
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
	createPopup(info.menuItemId, shareLink, shareText, tab)
})

// Reload context menu options on storage change (e.g. when added or removed on settings page)
chrome.storage.onChanged.addListener(function () {
	createContextMenu()
})

// Function for creating share popup
function createPopup(serverUrl, shareLink, shareText, tab) {
	var popupPage = chrome.runtime.getURL('share.html') + '?server=' + serverUrl + '&link=' + encodeURIComponent(shareLink) + '&text=' + encodeURIComponent(shareText)
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

// Function for action button
chrome.action.onClicked.addListener(async function (tab) {
	createPopup('generic', tab.url, tab.title, tab)
})