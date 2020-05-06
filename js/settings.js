const settingDefaults = {
  includePermalinks: true,
  includePIDs: true,
  includeCanonicalLinks: false
};

const settingIds = Object.keys(settingDefaults);

function getSettings(callback) {
  chrome.storage.sync.get(settingDefaults, callback);
}