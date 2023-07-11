const serverList = document.querySelector('#mastodon-server-list')

// Function to load settings from storage
function loadSettings() {
	chrome.storage.sync.get(function (data) {
		for (const i of data.serverList) {
			var el = document.createElement('option')
			el.value = i
			el.innerText = i
			serverList.appendChild(el)
		}
	})
}

// Function to save settings to storage
function saveSettings() {
	// Get list of servers
	var array = []
	document.querySelectorAll('#mastodon-server-list option').forEach(function (el) {
		array.push(el.value)
	})
	console.log(array)
	// Save to storage
	chrome.storage.sync.set({
		serverList: array
	}, function () {
		console.log('Settings saved')
	})
}

// Add server to list
document.querySelector('#server-add-btn').addEventListener('click', function () {
	// Get hostname from input
	var serverInput = document.querySelector('#mastodon-server-text').value.replace(' ', '');
	var serverDomain = '';
	if (serverInput.startsWith('https://')) {
		var serverObj = new URL(serverInput);
		serverDomain = serverObj.hostname;
	} else if (serverInput) {
		serverDomain = serverInput;
	} else {
		return true;
	}
	// Add URL to list
	var el = document.createElement('option')
	el.value = serverDomain
	el.innerText = serverDomain
	serverList.appendChild(el)
	serverList.value = serverDomain
	document.querySelector('#mastodon-server-text').value = ''
	saveSettings()
})

// Remove button
document.querySelector('#server-remove-btn').addEventListener('click', function () {
	var selectedOption = serverList.querySelector('option[value="' + serverList.value + '"]')
	serverList.removeChild(selectedOption)
	saveSettings()
})

// Open keyboard shortcut
document.querySelector('#mastodon-keyboard-shortcut').addEventListener('click', function () {
	// Firefox cannot automatically navigate to the keyboard shortcut configuration page
	if (window.navigator.userAgent.includes('Firefox')) {
		const bsCollapse = new bootstrap.Collapse('#firefoxShortcutCollapse').show()
	} else {
		chrome.tabs.create({ url: 'chrome://extensions/shortcuts#:~:text=Share%20to%20Mastodon' })
	}

})

loadSettings()