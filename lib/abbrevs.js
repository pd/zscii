// abbrev table mock
// probably less useful once i get to the ztables component

var abbrevs = function() {
  this.entries = [];
};

abbrevs.prototype.get = function(table, idx) {
  return this.entries[table * 100 + idx];
};

abbrevs.prototype.set = function(table, idx, s) {
  this.entries[table * 100 + idx] = s;
  return this;
};

module.exports = abbrevs
