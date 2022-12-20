// Function for populating settings
async function loadSettings() {
	// Retrieve settings from storage
	const server = document.getElementById('mastodon-server')
	new Promise(function (resolve) {
		chrome.storage.local.get(function (data) {
			console.log(data)
			// Server setting
			if (data.userServer) {
				server.value = data.userServer
			} else {
				document.querySelector('#mastodon-server-alert').classList.remove('d-none')
			}
			resolve()
		})
	}).then(function () {
		// Allow interaction on settings
		server.removeAttribute('disabled')
	})
}

// Save settings after any input change
document.querySelectorAll('input,select').forEach(function (el) {
	el.addEventListener('change', function () {
		chrome.storage.local.set({
			userServer: document.querySelector('#mastodon-server').value,
		}, function() {
			console.log('Settings saved')
		})
	})
})

loadSettings()