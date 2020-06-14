/**
 * Substitutes emojis into text nodes.
 * If the node contains more than just text (ex: it has child nodes),
 * call replaceText() on each of its children.
 *
 * @param  {Node} node    - The target DOM Node.
 * @return {void}         - Note: the emoji substitution is done inline.
 */
function replaceText(node) {

    console.log("启动插件")
    hdElems = node.getElementsByClassName('hd')
    for (let i = 0; i < hdElems.length; i++) {
        hdElem = hdElems[i]
        statusURL = hdElem.attributes.getNamedItem("data-status-url")
        if (statusURL) {
            console.log(statusURL.value)
            statusAnchor = document.createElement('a');
            statusAnchor.href = statusURL.value;
            statusAnchor.innerText = "🔗🔗";

            if (hdElem.children.length >= 2) {
                if (hdElem.children[1].className == 'text') {
                    title = hdElem.children[1]
                    referenceNode = title
                    for (let j = 0; j < title.children.length; j++) {
                        referenceNode = title.children[j]
                        if (referenceNode.tagName == 'BLOCKQUOTE')
                            break;
                    }

                    if (referenceNode.tagName == 'BLOCKQUOTE') {
                        hdElem.children[1].insertBefore(statusAnchor, referenceNode)
                    } else {
                        hdElem.children[1].appendChild(statusAnchor, referenceNode)
                    }
                }
            }
        }
    }
}

// Start the recursion from the body tag.
replaceText(document.body);

// Now monitor the DOM for additions and substitute emoji into new nodes.
// @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver.
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // This DOM change was new nodes being added. Run our substitution
            // algorithm on each newly added node.
            for (let i = 0; i < mutation.addedNodes.length; i++) {
                const newNode = mutation.addedNodes[i];
                replaceText(newNode);
            }
        }
    });
});
observer.observe(document.body, {
    childList: true,
    subtree: true
});
