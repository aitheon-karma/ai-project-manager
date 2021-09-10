export const itemRenderer = ({id, username ,name, logoURL}) => {
  const item = document.createElement('div');

  item.classList.add('ck-mention-custom-item');

  const logo = document.createElement('span');
  logo.classList.add('ck-mention-custom-item__logo');

  if (!logoURL) {
    logo.classList.add('ck-mention-custom-item__logo--empty');

    const shortName = name.replace('@', '').substr(0,2);
    const shortNameText = document.createTextNode(shortName);
    logo.appendChild(shortNameText);
  } else {
    logo.setAttribute("style", "background-image: url('" + `${logoURL}` + "')");
  }

  const userFullName = document.createElement('span');
  userFullName.classList.add('ck-mention-custom-item__name');
  
  const userFullNameText = document.createTextNode(name.replace('@', ''));
  userFullName.appendChild(userFullNameText);
  
  const userNickName = document.createElement('span');
  userNickName.classList.add('ck-mention-custom-item__username');

  const userNickNameText = document.createTextNode(username);
  userNickName.appendChild(userNickNameText);

  item.appendChild(logo);
  item.appendChild(userFullName);
  item.appendChild(userNickName);

  return item;
}