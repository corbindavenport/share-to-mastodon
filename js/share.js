/*
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
        */

async function init() {
    // Get data from URL and storage
    var inputParams = new URL((window.location.href)).searchParams
    var shareLink = inputParams.get('link')
    var shareText = inputParams.get('text')
    var data = await chrome.storage.sync.get()
    // Show warning if no servers are saved
    if (!data.serverList) {
        document.querySelector('#server-warning').classList.remove('d-none')
        return false
    }
    // Create list of servers
    var serverListEl = document.querySelector('#server-list')
    for (server in data.serverList) {
        // Create link list element
        var serverUrl = data.serverList[server]
        var linkEl = document.createElement('a')
        linkEl.classList.add('list-group-item', 'list-group-item', 'list-group-item-action', 'display-6')
        linkEl.innerText = serverUrl
        linkEl.href = 'https://' + serverUrl + '/share?text=' + encodeURIComponent(shareText + '\n\n' + shareLink)
        linkEl.rel = 'preconnect'
        // Add server icon to list
        var serverImg = document.createElement('img')
        serverImg.src = 'https://' + serverUrl + '/favicon.ico'
        serverImg.alt = serverUrl + ' icon'
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