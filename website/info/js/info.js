function CreateElement (parentElem, typeName, className)
{
	let elem = document.createElement (typeName);
	if (className !== null) {
		elem.classList.add (className);
	}
	parentElem.appendChild (elem);
	return elem;
}

function GenerateMenu (menuDiv, activeMenu)
{
	let items = [
		{ name: 'MANUAL', link: 'index.html'  },
		{ name: 'FAQ', link: 'faq.html' }
	];
	for (let item of items) {
		let element = CreateElement (menuDiv, 'a', null)
		element.innerHTML = item.name;
		element.setAttribute ('href', item.link);
		if (item.name === activeMenu) {
			element.classList.add ('active');
		}
	}
}

function GenerateHeader (activeMenu)
{
	let headerDiv = CreateElement (document.body, 'div', 'header');
	let frameDiv = CreateElement (headerDiv, 'div', 'frame');

	let logoDiv = CreateElement (frameDiv, 'div', 'logo');
	let logoImgLink = CreateElement (logoDiv, 'a', null);
	logoImgLink.setAttribute ('href', 'index.html');
	let logoImgWithTextDiv = CreateElement (logoImgLink, 'img', 'logo_with_text');
	logoImgWithTextDiv.src = 'images/3dviewer_net_logo_text.svg';
	let logoImgWithoutTextDiv = CreateElement (logoImgLink, 'img', 'logo_without_text');
	logoImgWithoutTextDiv.src = 'images/3dviewer_net_logo.svg';

	let menuDiv = CreateElement (frameDiv, 'div', 'menu');
	GenerateMenu (menuDiv, activeMenu);
}
