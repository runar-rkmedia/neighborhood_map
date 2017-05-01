function getWikiArticle(subject) {
    return $.ajax({
        url: "https://en.wikipedia.org/w/api.php",
        data: {
            format: "json",
            action: "parse",
            page: subject,
            prop: "text",
            section: 0,
        },
        dataType: 'jsonp',
        headers: {
            'Api-User-Agent': 'MyCoolTool/1.1 (http://example.com/MyCoolTool/; MyCoolTool@example.com) BasedOnSuperLib/1.4'
        }
    });
}
