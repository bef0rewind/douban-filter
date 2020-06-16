function captureToCanvas(selectedPos, captureType) {
    const MAX_CANVAS_DIMENSION = 32767;
    let height = selectedPos.bottom - selectedPos.top;
    let width = selectedPos.right - selectedPos.left;
    const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    const ctx = canvas.getContext("2d");

    // Scale the canvas for high-density displays, except for full-page shots.
    let expand = window.devicePixelRatio !== 1;
    if (captureType === "fullPage" || captureType === "fullPageTruncated") {
        expand = false;
        canvas.width = width;
        canvas.height = height;
    } else {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
    }
    if (expand) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Double-check canvas width and height are within the canvas pixel limit.
    // If the canvas dimensions are too great, crop the canvas and also crop
    // the selection by a devicePixelRatio-scaled amount.
    if (canvas.width > MAX_CANVAS_DIMENSION) {
        canvas.width = MAX_CANVAS_DIMENSION;
        width = expand ? Math.floor(canvas.width / window.devicePixelRatio) : canvas.width;
    }
    if (canvas.height > MAX_CANVAS_DIMENSION) {
        canvas.height = MAX_CANVAS_DIMENSION;
        height = expand ? Math.floor(canvas.height / window.devicePixelRatio) : canvas.height;
    }

    ctx.drawWindow(window, selectedPos.left, selectedPos.top, width, height, "#fff");
    return canvas;
}

function screenshotPage(selectedPos, captureType) {
    const canvas = captureToCanvas(selectedPos, captureType);
    const pngToJpegCutoff = 2500000;
    const limit = pngToJpegCutoff;
    let dataUrl = canvas.toDataURL();
    if (limit && dataUrl.length > limit) {
        const jpegDataUrl = canvas.toDataURL("image/jpeg");
        if (jpegDataUrl.length < dataUrl.length) {
            // Only use the JPEG if it is actually smaller
            dataUrl = jpegDataUrl;
        }
    }
    return dataUrl;
}

function screenshotAnchor(statusWrapperElem) {
    imageAnchor = document.createElement('a');
    imageAnchor.innerText = "📷";
    imageAnchor.statusWrapperElem = statusWrapperElem;

    imageAnchor.onclick = function () {
        pos = statusWrapperElem.getBoundingClientRect();
        pos = {
            top: pos.top + window.scrollY,
            left: pos.left + window.scrollX,
            bottom: pos.bottom + window.scrollY,
            right: pos.right + window.scrollX,
        };
        dataURL = screenshotPage(pos, null);
        info = {
            url: dataURL,
            filename: new Date().getTime().toString() + '.jpeg'
        };

        const port = browser.runtime.connect();
        port.postMessage(info);
        port.disconnect();
    };
    return imageAnchor;
}

function replaceText(node) {
    console.log("启动插件")
    hdElems = node.getElementsByClassName('hd')
    for (let i = 0; i < hdElems.length; i++) {
        hdElem = hdElems[i]
        statusURL = hdElem.attributes.getNamedItem("data-status-url")
        if (statusURL) {
            statusAnchor = document.createElement('a');
            statusAnchor.href = statusURL.value;
            statusAnchor.target = '_blank';
            statusAnchor.innerText = "🔗";

            if (hdElem.children.length >= 2) {
                if (hdElem.children[1].className == 'text') {
                    title = hdElem.children[1]
                    referenceNode = title
                    for (let j = 0; j < title.children.length; j++) {
                        referenceNode = title.children[j]
                        if (referenceNode.tagName == 'BLOCKQUOTE')
                            break;
                    }

                    // create status image clipper
                    statusWrapperElem = hdElem.parentElement.parentElement;
                    if (statusWrapperElem.parentElement.classList.contains("new-status")) {
                        statusWrapperElem = statusWrapperElem.parentElement;
                    }

                    imageAnchor = screenshotAnchor(statusWrapperElem);

                    if (referenceNode.tagName == 'BLOCKQUOTE') {
                        title.insertBefore(statusAnchor, referenceNode)
                        title.insertBefore(imageAnchor, referenceNode)
                    } else {
                        title.appendChild(statusAnchor, referenceNode)
                        title.appendChild(imageAnchor, referenceNode)
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
