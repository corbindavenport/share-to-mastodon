const isFirefox = chrome.runtime.getURL('').startsWith('moz-extension://')

// Initialize welcome message and context menu entry on extension load
chrome.runtime.onInstalled.addListener(async function (details) {
	// Show welcome message
	if (details.reason === 'install' || details.reason === 'update') {
		chrome.tabs.create({ 'url': chrome.runtime.getURL('welcome.html') });
	};
	// Enable Bluesky setting for users with Mastodon servers already set
	// Turning off Bluesky in settings will not re-enable this
	var data = await chrome.storage.sync.get();
	if (data.serverList && (data.serverList.length > 0) && !Object.hasOwn(data, 'blueskyEnabled')) {
		await chrome.storage.sync.set({ blueskyEnabled: true });
	}
	// Initialize context menu
	createContextMenu();
	// Migrate data if needed
	migrateOldData();
})

// Function for migrating data from version 1.0
async function migrateOldData() {
	// Chrome/Edge version saved a single server in a "userServer" string in chrome.storage.sync
	// Firefox version saved it in the same "userServer" string, but in chrome.local.sync
	if (isFirefox) {
		var data = await chrome.storage.local.get()
	} else {
		var data = await chrome.storage.sync.get()
	}
	if (data.userServer) {
		var oldServer = data.userServer
		console.log('Migrating server selection ' + oldServer + ' to new format...')
		// Move data
		await chrome.storage.sync.set({ serverList: [oldServer] })
		// Delete old data
		await chrome.storage.local.clear()
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
	if ((data.serverList && data.serverList.length > 0) || data.blueskyEnabled) {
		// Create Bluesky menu item if enabled
		if (data.blueskyEnabled) {
			chrome.contextMenus.create({
				id: 'bsky.app',
				title: 'Share to Bluesky',
				contexts: ['selection', 'link', 'page']
			})
		}
		// Create separator if both Bluesky and at least one Mastodon server are enabled
		if (data.blueskyEnabled && data.serverList && (data.serverList.length > 0)) {
			chrome.contextMenus.create({
				id: 'separator1',
				type: 'separator',
				contexts: ['selection', 'link', 'page']
			})
		}
		// Create menu item for each Mastodon server
		if (data.serverList && data.serverList.length > 0) {
			for (server in data.serverList) {
				var serverUrl = data.serverList[server]
				chrome.contextMenus.create({
					id: serverUrl,
					title: 'Share to ' + serverUrl,
					contexts: ['selection', 'link', 'page']
				})
			}
		}
		// Add seperator and link to settings, but only if there are at least two services enabled
		// Example: Bluesky and one Mastodon server, or two Mastodon servers
		if ((data.blueskyEnabled && data.serverList && (data.serverList.length > 0)) || (data.serverList && (data.serverList.length > 1))) {
			chrome.contextMenus.create({
				id: 'separator2',
				type: 'separator',
				contexts: ['selection', 'link', 'page']
			})
			chrome.contextMenus.create({
				id: 'edit-servers',
				title: 'Edit service/server list...',
				contexts: ['selection', 'link', 'page']
			})
		}
	} else {
		// Create generic menu item because no servers are set yet
		chrome.contextMenus.create({
			id: "generic",
			title: 'Share to Mastodon',
			contexts: ['selection', 'link', 'page']
		})
	}
}

// Function for handling context menu clicks
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
	console.log(info, tab)
	// Open settings page if requested
	if (info.menuItemId === 'edit-servers') {
		chrome.runtime.openOptionsPage()
		return false
	}
	// Set link and description
	var shareLink = ''
	var shareText = ''
	if ((info.linkText || info.selectionText) && info.linkUrl) {
		// The user right-clicked on a link that has selected text
		// Chromium sets the selected text as "selectionText", but Firefox uses "linkText"
		shareLink = info.linkUrl
		shareText = (info.linkText || info.selectionText)
	} else if (info.selectionText) {
		// The user selected text that isn't a link (at least not entirely)
		shareLink = info.pageUrl
		shareText = '"' + info.selectionText + '"'
	} else {
		// The user opened the context menu without selecting text (e.g right-clicking on the page background)
		shareLink = info.pageUrl
		shareText = tab.title
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
	console.log('Popup dimensions:', popupWidth, popupHeight, y, x)
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