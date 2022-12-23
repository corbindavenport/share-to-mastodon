# Share to Mastodon Bookmarklet

This bookmarklet replicates most of the functionality of the Share to Mastodon extension, except that opening the bookmark is the only way to activate it. The extension has additional options, like an item in the browser's context menu and a keyboard shortcut.

### The bookmark

Open the bookmark manager in your web browser (`chrome://bookmarks/` in Chrome, Bookmarks > Edit Bookmarks in Safari, etc.) and create a new bookmark with the below text string as the URL. **Near the start of the URL, replace "mastodon.social" with your Mastodon server, if it's different than mastodon.social.** On Safari, you may have to edit an existing bookmark.

```
javascript:var serverDomain="mastodon.social";var shareLink=window.location.href;var shareText="";var selectedText=window.getSelection().toString();if(selectedText){shareText='"'+selectedText+'"'}else{shareText=document.title}var url="https://"+serverDomain+'/share?text='+encodeURIComponent(shareText+'\n\n'+shareLink);window.open(url,"_blank","popup=true,width=500,height=500,left=100,top=100");
```

Opening the bookmarklet will open the share dialog, so if you have the bookmarks bar always visible, sharing to Mastodon only takes one click.

### Non-minified version

```
var serverDomain = "mastodon.social"
var shareLink = window.location.href
var shareText = ""
var selectedText = window.getSelection().toString()
if (selectedText) {
	// Use selected text if available
	shareText = '"' + selectedText + '"'
} else {
	// Use page title as fallback
	shareText = document.title
}
// Open popup
var url = "https://" + serverDomain + '/share?text=' + encodeURIComponent(shareText + '\n\n' + shareLink)
window.open(url, "_blank", "popup=true,width=500,height=500,left=100,top=100")
```
