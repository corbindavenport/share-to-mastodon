// Function to initialize UI and redirects
async function init() {
    // Generate links to options page
    document.querySelectorAll('.extension-settings-link').forEach(function(el) {
        el.addEventListener('click', function() {
            chrome.runtime.openOptionsPage()
            window.close()
        })
    })
    // Get data from URL and storage
    var inputParams = new URL((window.location.href)).searchParams
    var shareLink = inputParams.get('link')
    var shareText = inputParams.get('text')
    var data = await chrome.storage.sync.get()
    // Show warning if no servers are saved
    if ((!data.serverList) || (data.serverList.length === 0)) {
        document.querySelector('#server-warning').classList.remove('d-none')
        return false
    }
    // If there's only one server, or if the server was picked from the context menu, redirect to that one
    if (inputParams.get('server') != 'generic') {
        document.querySelector('#server-loading').classList.remove('d-none')
        window.location = 'https://' + inputParams.get('server') + '/share?text=' + encodeURIComponent(shareText + '\n\n' + shareLink)
        return false
    } else if (data.serverList.length === 1) {
        document.querySelector('#server-loading').classList.remove('d-none')
        window.location = 'https://' + data.serverList[0] + '/share?text=' + encodeURIComponent(shareText + '\n\n' + shareLink)
        return false
    }
    console.log(inputParams.get('server'))
    // Create list of servers
    var serverListEl = document.querySelector('#server-list')
    for (server in data.serverList) {
        // Create link list element
        var serverUrl = data.serverList[server]
        var linkEl = document.createElement('a')
        linkEl.classList.add('list-group-item', 'list-group-item', 'list-group-item-action', 'fw-bold')
        linkEl.innerText = serverUrl
        linkEl.href = 'https://' + serverUrl + '/share?text=' + encodeURIComponent(shareText + '\n\n' + shareLink)
        linkEl.rel = 'preconnect'
        // Add server icon to list
        var serverImg = document.createElement('img')
        serverImg.setAttribute('src', 'https://' + serverUrl + '/favicon.ico')
        serverImg.setAttribute('alt', serverUrl + ' icon')
        serverImg.ariaHidden = 'true'
        serverImg.onerror = function() {
            // Show a monochrome Mastodon icon if the server isn't responding
            this.src = chrome.runtime.getURL('img/mastodon-offline.png')
        }
        linkEl.prepend(serverImg)
        // Inject element
        serverListEl.appendChild(linkEl)
    }
    // Show list
    serverListEl.classList.remove('d-none')
}

// Show loading animation when a link is clicked
window.addEventListener('beforeunload', function() {
    document.querySelector('#server-list').classList.add('d-none')
    document.querySelector('#server-loading').classList.remove('d-none')
})

init()