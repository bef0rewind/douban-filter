function getTypeFromDataUrl(url) {
    let contentType = url.split(",", 1)[0];
    contentType = contentType.split(";", 1)[0];
    contentType = contentType.split(":", 2)[1];
    return contentType;
};

function dataUrlToBlob(url) {
    const binary = atob(url.split(",", 2)[1]);
    let contentType = getTypeFromDataUrl(url);
    if (contentType !== "image/png" && contentType !== "image/jpeg") {
        contentType = "image/png";
    }
    const data = Uint8Array.from(binary, char => char.charCodeAt(0));
    const blob = new Blob([data], { type: contentType });
    return blob;
};


function download(info) {
    // 'data:' urls don't work directly, let's use a Blob
    // see http://stackoverflow.com/questions/40269862/save-data-uri-as-file-using-downloads-download-api
    const blob = dataUrlToBlob(info.url);
    const url = URL.createObjectURL(blob);

    browser.downloads.download({
        url,
        filename: info.filename,
    });
}

browser.runtime.onConnect.addListener(function (messagePort) {
    messagePort.onMessage.addListener(async function (info) {
        download(info);
    });
});