var totalPage = 0;
var current = 0;
var currentPage = 1;
var offset = 1;
var scrollPosList = [];

$(document).ready(function () {
	// var pageWidth =  window.innerWidth;
	var pageWidth = $(window).width();
	scrollPosList.push(0);
	var elm;

	debugLog('page width:%d',pageWidth);
	debugLog($('body').css('padding-right'));

	var width = parseInt($('body').css('padding-right'));
	// width = parseInt($('body').css('padding-right'));
	var children = $('div.main').children();
	$.each(children, function(index, domElm) {
		var elm = $(domElm);
		var outerWidth = elm.outerWidth(true);
		var tagName = elm.prop("tagName");

		// ページの先頭が<br>から開始させない
		if ((width + outerWidth <= pageWidth) || 
			(tagName.toLowerCase() === "br")) {
			width += outerWidth;
			return true;
		}

		// <p>以外は内容を分割しない(<p>以外でタグ、かつ１つの要素で１ページの幅を超える場合は
		// 越えた分は閲覧出来ないことになるが、それはひとまず無視)
		if (tagName.toLowerCase() !== "p") {
			elm.before('<br>');
			elm = elm.before();
			setScrollPos();
			width = outerWidth;
			return true;
		}

		var html = elm.html();
		var newHtml = '';
		var pos = 0;
		elm.html('');
		while (pos <= html.length) {
			var char = html.substr(pos, 1);
			if ('<' !== char) {
				if (needNewPage(newHtml + char)) {
					// 行頭禁則処理は簡易的にチェック
					// ※charは次の行に表示されるので行末禁則処理のチェックは行わない
					if (!allowFirstPos(char)) {
						char = newHtml.slice(-1) + char;
						newHtml = newHtml.substr(0, newHtml.length - 1);
					} 
					createNewPage(newHtml);
					newHtml = char;
				} else {
					newHtml += char;
				}
				pos++;
			} else {
				var innerHtml = '';
				var p = html.indexOf('>', pos + 1);
				var tagLength = p - pos;
				var endTag = '</' +  html.substr(pos + 1, p - pos).split(' ')[0];
				if (endTag.slice(-1) !== '>') {
					endTag += '>';
				}
				p = html.indexOf(endTag, pos + tagLength);
				if (0 <= p) {
					innerHtml = html.substr(pos, p - pos + endTag.length);
					pos = p + endTag.length;
					if (needNewPage(newHtml + innerHtml)) {
						createNewPage(newHtml);
						newHtml = innerHtml;
					} else {
						newHtml += innerHtml;
					}
				} else {
					debugLog('end tag(%s) not found', endTag)
					pos += tagLength;
				}
			}
		}
		if (0 < newHtml.length) {
			elm.html(newHtml);
		}
		if (elm.text().length == 0) {
			elm.remove();
		}
		width = elm.outerWidth();

		function needNewPage(html) {
			elm.html(html);
			return (pageWidth < width + elm.outerWidth());
		}
		function createNewPage(innerHtml) {
			elm.html(innerHtml);
			// 中途半端に次ページの先頭に表示する行が末尾に表示されるのを防ぐために<br>を追加
			elm.after('<br>');
			elm = elm.next();
			setScrollPos();
			width = 0;
			// 現在の要素をインデントなしの<p>に変更
			elm.after('<p style="text-indent:0;"></p>');
			elm = elm.next();
		}
		function setScrollPos() {
			scrollPosList.push(elm.offset().left - pageWidth + elm.outerWidth());
			// scrollPosList.push(elm.offset().left - pageWidth + elm.outerWidth());
		}
		function allowFirstPos(char) {
			var prohibitionList = ['、','。','・','）','」','》','』','】','!?','?!', '!!'];
			return (-1 == prohibitionList.indexOf(char));
		}
	});

	totalPage = scrollPosList.length;
	debugLog(scrollPosList);
	debugLog(totalPage);
	// 非常に雑な対応だけど最終ページに余裕を持たすため２ページ分の幅を加算しておく
	// ※pageWidthは厳密には正しくない気もするので多めに取っておく
	$('body').width(-1 * scrollPosList[scrollPosList.length - 1] + pageWidth * 2);

	$('body').on('touchstart', onTouchStart); 
	$('body').on('touchmove', onTouchMove);
	$('body').on('touchend', onTouchEnd);

	scrollTo(0,  0) ;
	return;
});

var direction, position;
function onTouchStart(event) {
	position = getPosition(event);
	direction = '';
}

function onTouchMove(event) {
	if (position - getPosition(event) > offset) {
		direction = 'left';
	} else if (position - getPosition(event) < (-1 * offset)) {
		direction = 'right';
	}
}

function onTouchEnd(event) {
	if (!direction) {
		return;
	}
	debugLog('direction : %s', direction);
	if (direction == 'right'){
		moveToNext();
	} else {
		moveToPrev();
	}
}
function getPosition(event) {
	return event.originalEvent.touches[0].pageX;
}

function moveToPrev() {
	currentPage--;
	if (currentPage < 1) {
		currentPage = 1;
	}
	moveToCurrent();
}
function moveToNext() {
	currentPage++;
	if (totalPage < currentPage) {
		currentPage = totalPage;
	}
	moveToCurrent();
}
function moveToCurrent() {
	// scrollTo(-1 * scrollPosList[currentPage-1],  0) ;
	// $('html,body').animate({scrollLeft: -1 * scrollPosList[currentPage-1]}, 300);
	$('html,body').animate({scrollLeft: scrollPosList[currentPage-1]}, 300);
}

function debugLog() {
	console.log.apply(console, arguments);
}
