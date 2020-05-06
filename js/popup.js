function checkboxListener(event) {
  const checkbox = event.target;
  const settings = {};
  settings[checkbox.id] = checkbox.checked;
  chrome.storage.sync.set(settings);
}

function refresh() {
  getSettings(function(settings) {
    for (const id of settingIds) {
      const checkbox = document.getElementById(id);
      checkbox.checked = settings[id];
    }
  });
}

for (const id of settingIds) {
  const checkbox = document.getElementById(id);
  checkbox.addEventListener('input', checkboxListener);
}
const button = document.getElementById('reset');
button.addEventListener('click', function(event) {
  chrome.storage.sync.clear(refresh);
});

refresh();