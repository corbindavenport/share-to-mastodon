const serverListEl = document.querySelector('#server-list');

// Function to generate URL
function getFinalURL(domain, text, link) {
    var url = ''
    if (domain === 'bsky.app') {
        // Bluesky
        url = 'https://bsky.app/intent/compose?text=' + encodeURIComponent(text + '<br /><br />' + link);
    } else if ((domain === 'elk.zone') || (domain === 'main.elk.zone')) {
        // Elk web app
        // Documentation: https://github.com/elk-zone/elk/blob/main/modules/pwa/i18n.ts#:~:text=share_target
        url = 'https://elk.zone/intent/post?text=' + encodeURIComponent(text + '<br /><br />' + link);
    } else {
        // Standard Mastodon URL intent, also used by Firefish/Calckey, Catodon, Misskey, and other projects
        // Misskey documentation: https://misskey-hub.net/en/docs/features/share-form.html
        // Firefish/Calckey implementation: https://codeberg.org/firefish/firefish/src/branch/main/packages/backend/src/server/web/manifest.json#:~:text=share_target
        url = 'https://' + domain + '/share?text=' + encodeURIComponent(text + '\n\n' + link);
    }
    return url
}

// Function to find the icon for a Mastodon server, and load it in list item's image
async function loadServerIcon(serverDomain, imgEl) {
    let iconImg;
    // Use built-in icons for Elk and Bluesky
    if (serverDomain === 'bsky.app') {
        imgEl.setAttribute('src', chrome.runtime.getURL('img/bluesky.png'));
        return;
    } else if ((serverDomain === 'elk.zone') || (serverDomain === 'main.elk.zone')) {
        imgEl.setAttribute('src', chrome.runtime.getURL('img/elk.png'));
        return;
    }
    // Try to load 48x48 icon using Mastodon instance API (Mastodon v4.3+)
    let json = {};
    try {
        const apiResponse = await fetch(`https://${serverDomain}/api/v2/instance`);
        json = await apiResponse.json();
    } catch (e) {
        console.log('Error fetching server information:', e);
    }
    if (json.hasOwnProperty('icon')) {
        // Server has a defined icon in API response
        iconImg = json.icon[1].src;
        imgEl.setAttribute('src', iconImg);
        console.log(`Found icon for ${serverDomain}: ${iconImg}`);
        return;
    }
    // Try to load legacy favicon (Mastodon <4.3, other platforms)
    iconImg = `https://${serverDomain}/favicon.ico`;
    imgEl.onload = function () {
        // Server has a favicon
        console.log(`Found icon for ${serverDomain}: ${iconImg}`);
    }
    imgEl.onerror = function () {
        // Server doesn't have a favicon, load fallback icon
        imgEl.setAttribute('src', chrome.runtime.getURL('img/default_server.png'));
        console.log(`Using fallback icon for ${serverDomain}.`);
    }
    imgEl.src = iconImg;
}

// Function to create list item for a service
function createListItem(serverUrl, shareText, shareLink) {
    // Create link list element
    var linkEl = document.createElement('a');
    linkEl.classList.add('list-group-item', 'list-group-item', 'list-group-item-action', 'fw-bold');
    if (serverUrl === 'bsky.app') {
        linkEl.innerText = 'Bluesky';
    } else {
        linkEl.innerText = serverUrl;
    }
    linkEl.href = getFinalURL(serverUrl, shareText, shareLink);
    linkEl.rel = 'preconnect';
    // Add server icon to list
    var serverImg = document.createElement('img');
    loadServerIcon(serverUrl, serverImg);
    serverImg.setAttribute('alt', '');
    linkEl.prepend(serverImg);
    // Inject element
    serverListEl.appendChild(linkEl);
}

// Function to initialize UI and redirects
async function init() {
    // Generate links to options page
    document.querySelectorAll('.extension-settings-link').forEach(function (el) {
        el.addEventListener('click', function () {
            chrome.runtime.openOptionsPage()
            window.close()
        })
    })
    // Get data from URL and storage
    var inputParams = new URL((window.location.href)).searchParams
    var shareLink = inputParams.get('link')
    var shareText = inputParams.get('text')
    var data = await chrome.storage.sync.get()
    // Show warning if Bluesky isn't enabled and no servers are saved
    if ((!data.blueskyEnabled) && ((!data.serverList) || (data.serverList.length === 0))) {
        document.querySelector('#server-warning').classList.remove('d-none')
        return false
    }
    // Redirect to a service/server automatically if certain conditions are met
    if (inputParams.get('server') != 'generic') {
        // If the server was picked from the context menu, redirect to that server
        document.querySelector('#server-loading').classList.remove('d-none')
        window.location = getFinalURL(inputParams.get('server'), shareText, shareLink)
        return false
    } else if (!data.blueskyEnabled && (data.serverList && (data.serverList.length === 1))) {
        // If Bluesky is not enabled, and there is only one Mastodon server enabled, redirect to the one Mastodon server
        document.querySelector('#server-loading').classList.remove('d-none')
        window.location = getFinalURL(data.serverList[0], shareText, shareLink)
        return false
    } else if (data.blueskyEnabled && ((!data.serverList) || (data.serverList.length === 0))) {
        // If Bluesky is enabled, and there are no Mastodon servers enabled, redirect to Bluesky
        document.querySelector('#server-loading').classList.remove('d-none')
        window.location = getFinalURL('bsky.app', shareText, shareLink)
        return false
    }
    // Create list item for Bluesky if enabled
    if (data.blueskyEnabled) {
        createListItem('bsky.app', shareText, shareLink);
    }
    // Create list of Mastodon servers
    for (server in data.serverList) {
        createListItem(data.serverList[server], shareText, shareLink);
    }
    // Show list
    serverListEl.classList.remove('d-none')
}

// Show loading animation when a link is clicked
window.addEventListener('beforeunload', function () {
    document.querySelector('#server-list').classList.add('d-none')
    document.querySelector('#server-loading').classList.remove('d-none')
})

init()